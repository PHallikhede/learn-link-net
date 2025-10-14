-- Create app_role enum for role management
CREATE TYPE public.app_role AS ENUM ('student', 'alumni', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  bio TEXT,
  college TEXT NOT NULL,
  skills TEXT[],
  interests TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Create student_details table
CREATE TABLE public.student_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  branch TEXT,
  year INTEGER,
  goals TEXT
);

-- Create alumni_details table
CREATE TABLE public.alumni_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company TEXT,
  job_title TEXT,
  graduation_year INTEGER,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected'))
);

-- Create connections table for connect requests
CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alumni_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, alumni_id)
);

-- Create forum_posts table
CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create forum_replies table
CREATE TABLE public.forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, college)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'college', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at
  BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "User roles are viewable by everyone"
  ON public.user_roles FOR SELECT
  USING (TRUE);

CREATE POLICY "Only admins can insert user roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update user roles"
  ON public.user_roles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for student_details
CREATE POLICY "Student details are viewable by everyone"
  ON public.student_details FOR SELECT
  USING (TRUE);

CREATE POLICY "Students can insert their own details"
  ON public.student_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update their own details"
  ON public.student_details FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for alumni_details
CREATE POLICY "Alumni details are viewable by everyone"
  ON public.alumni_details FOR SELECT
  USING (TRUE);

CREATE POLICY "Alumni can insert their own details"
  ON public.alumni_details FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Alumni can update their own details"
  ON public.alumni_details FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update alumni verification"
  ON public.alumni_details FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for connections
CREATE POLICY "Connections are viewable by involved users"
  ON public.connections FOR SELECT
  USING (auth.uid() = student_id OR auth.uid() = alumni_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can create connection requests"
  ON public.connections FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Alumni can update connection status"
  ON public.connections FOR UPDATE
  USING (auth.uid() = alumni_id);

-- RLS Policies for forum_posts
CREATE POLICY "Forum posts are viewable by everyone"
  ON public.forum_posts FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can create posts"
  ON public.forum_posts FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own posts"
  ON public.forum_posts FOR UPDATE
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own posts"
  ON public.forum_posts FOR DELETE
  USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for forum_replies
CREATE POLICY "Forum replies are viewable by everyone"
  ON public.forum_replies FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can create replies"
  ON public.forum_replies FOR INSERT
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can delete their own replies"
  ON public.forum_replies FOR DELETE
  USING (auth.uid() = author_id OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for post_likes
CREATE POLICY "Post likes are viewable by everyone"
  ON public.post_likes FOR SELECT
  USING (TRUE);

CREATE POLICY "Authenticated users can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);