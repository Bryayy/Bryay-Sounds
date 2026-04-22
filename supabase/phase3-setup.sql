-- ============================================
-- PHASE 3: STORAGE + CATALOG SETUP
-- Run this in Supabase SQL Editor (new query tab)
-- ============================================

-- 1. Create storage buckets for beat files
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('beats-tagged', 'beats-tagged', true),
  ('beats-clean', 'beats-clean', false),
  ('beats-stems', 'beats-stems', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies - tagged previews are public, clean/stems require auth
CREATE POLICY "Anyone can view tagged beats"
ON storage.objects FOR SELECT
USING (bucket_id = 'beats-tagged');

CREATE POLICY "Anyone can download tagged beats"
ON storage.objects FOR SELECT
USING (bucket_id = 'beats-tagged');

CREATE POLICY "Authenticated users can download clean beats"
ON storage.objects FOR SELECT
USING (bucket_id = 'beats-clean' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can download stems"
ON storage.objects FOR SELECT
USING (bucket_id = 'beats-stems' AND auth.role() = 'authenticated');

-- Admin upload policies
CREATE POLICY "Admins can upload tagged beats"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'beats-tagged' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can upload clean beats"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'beats-clean' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can upload stems"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'beats-stems' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Admin delete policies
CREATE POLICY "Admins can delete tagged beats"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'beats-tagged' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can delete clean beats"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'beats-clean' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can delete stems"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'beats-stems' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 3. Add a function to handle beat downloads with credit deduction
CREATE OR REPLACE FUNCTION public.download_beat(
  p_user_id uuid,
  p_beat_id uuid
)
RETURNS json AS $$
DECLARE
  v_profile public.profiles;
  v_beat public.beats;
  v_existing public.downloads;
  v_license_id text;
  v_stream_cap_audio integer;
  v_stream_cap_video integer;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  
  IF v_profile IS NULL THEN
    RETURN json_build_object('error', 'User not found');
  END IF;

  -- Check if user has an active plan
  IF v_profile.plan = 'free' OR v_profile.plan IS NULL THEN
    RETURN json_build_object('error', 'You need an active subscription to download beats');
  END IF;

  -- Check if user has credits
  IF v_profile.credits_remaining <= 0 THEN
    RETURN json_build_object('error', 'No credits remaining. Credits reset on your next billing date.');
  END IF;

  -- Get beat info
  SELECT * INTO v_beat FROM public.beats WHERE id = p_beat_id;
  
  IF v_beat IS NULL THEN
    RETURN json_build_object('error', 'Beat not found');
  END IF;

  -- Check if beat is available
  IF v_beat.exclusive_sold = true THEN
    RETURN json_build_object('error', 'This beat has been sold as an exclusive and is no longer available');
  END IF;

  -- Check if user already downloaded this beat
  SELECT * INTO v_existing FROM public.downloads 
  WHERE user_id = p_user_id AND beat_id = p_beat_id;
  
  IF v_existing IS NOT NULL THEN
    RETURN json_build_object('error', 'already_downloaded', 'download_id', v_existing.id, 'message', 'You already downloaded this beat. You can re-download it from your dashboard.');
  END IF;

  -- Set stream caps based on plan
  IF v_profile.plan = 'basic' THEN
    v_stream_cap_audio := 500000;
    v_stream_cap_video := 500000;
  ELSIF v_profile.plan = 'premium' THEN
    v_stream_cap_audio := 2000000;
    v_stream_cap_video := 2000000;
  END IF;

  -- Generate license ID
  v_license_id := 'LIC-' || upper(substr(md5(random()::text), 1, 8)) || '-' || to_char(now(), 'YYYYMMDD');

  -- Deduct credit
  UPDATE public.profiles 
  SET credits_remaining = credits_remaining - 1, updated_at = now()
  WHERE id = p_user_id;

  -- Record the download
  INSERT INTO public.downloads (user_id, beat_id, license_tier, license_id, stream_cap_audio, stream_cap_video)
  VALUES (p_user_id, p_beat_id, v_profile.plan, v_license_id, v_stream_cap_audio, v_stream_cap_video);

  -- Increment beat download count
  UPDATE public.beats 
  SET download_count = download_count + 1, updated_at = now()
  WHERE id = p_beat_id;

  RETURN json_build_object(
    'success', true,
    'license_id', v_license_id,
    'credits_remaining', v_profile.credits_remaining - 1,
    'beat_title', v_beat.title,
    'clean_file_url', v_beat.clean_file_url
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Seed some sample beats so the catalog has content
INSERT INTO public.beats (title, genre, bpm, key, duration, is_hot) VALUES
  ('Dembow Nights', 'Dembow', 120, 'Cm', '3:24', true),
  ('La Calle Sabe', 'Reggaeton', 140, 'Gm', '2:58', false),
  ('Noche Fría', 'R&B / Latin', 88, 'Am', '3:41', true),
  ('Perreo Oscuro', 'Reggaeton', 100, 'Dm', '3:12', false),
  ('Sigo Pa''lante', 'Trap Latino', 130, 'Fm', '3:05', false),
  ('Maldita', 'Latin Urban', 95, 'Bbm', '3:33', true),
  ('Fantasma', 'Dembow', 145, 'Em', '2:47', false),
  ('Bajo La Luna', 'R&B / Latin', 78, 'Db', '4:02', false),
  ('Coco Loco', 'Reggaeton', 110, 'Ab', '3:18', true)
ON CONFLICT DO NOTHING;
