-- Create trigger to automatically assign user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert the user's profile
  INSERT INTO public.profiles (id, full_name, email, college, skills, interests)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'college',
    COALESCE((NEW.raw_user_meta_data->>'skills')::text[], ARRAY[]::text[]),
    COALESCE((NEW.raw_user_meta_data->>'interests')::text[], ARRAY[]::text[])
  );
  
  -- Assign the user role based on metadata
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, (NEW.raw_user_meta_data->>'role')::app_role);
  
  -- If student, create student_details record
  IF (NEW.raw_user_meta_data->>'role') = 'student' THEN
    INSERT INTO public.student_details (user_id, year, branch, goals)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'year')::integer,
      NEW.raw_user_meta_data->>'branch',
      NEW.raw_user_meta_data->>'goals'
    );
  END IF;
  
  -- If alumni, create alumni_details record
  IF (NEW.raw_user_meta_data->>'role') = 'alumni' THEN
    INSERT INTO public.alumni_details (user_id, graduation_year, company, job_title, verification_status)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'graduation_year')::integer,
      NEW.raw_user_meta_data->>'company',
      NEW.raw_user_meta_data->>'job_title',
      'pending'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();