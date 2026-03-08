-- ==========================================
-- 1. CORE TABLES
-- ==========================================

-- Generic entries (Settings, Notices, etc.)
CREATE TABLE IF NOT EXISTS public.app_entries (
    id TEXT PRIMARY KEY,
    year TEXT NOT NULL,
    key TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(year, key)
);

-- Students Table (Full Details)
CREATE TABLE IF NOT EXISTS public.students_data (
    id TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    name TEXT NOT NULL,
    gender TEXT,
    father_name TEXT,
    mother_name TEXT,
    address TEXT,
    contact_number TEXT,
    dob TEXT,
    dob_type TEXT,
    gmail TEXT,
    transport_mode TEXT,
    current_class TEXT,
    admission_date TEXT,
    roll_number TEXT,
    blood_group TEXT,
    profile_picture TEXT, -- Base64
    daily_allowance NUMERIC DEFAULT 0,
    username TEXT,
    password TEXT,
    login_count INTEGER DEFAULT 0,
    last_login_date TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (academic_year, id)
);

-- Teachers Table (Full Details)
CREATE TABLE IF NOT EXISTS public.teachers_data (
    id TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    name TEXT NOT NULL,
    gender TEXT,
    contact_number TEXT,
    gmail TEXT,
    address TEXT,
    dob TEXT,
    blood_group TEXT,
    qualification TEXT,
    experience TEXT,
    join_date TEXT,
    profile_picture TEXT, -- Base64
    class_teacher_of TEXT,
    assignments JSONB DEFAULT '[]'::jsonb,
    username TEXT,
    password TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (academic_year, id)
);

-- ==========================================
-- 2. FINANCIAL TABLES
-- ==========================================

-- Invoices (Student Fees, Paid and Dues)
CREATE TABLE IF NOT EXISTS public.invoices_data (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    student_id TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    date TEXT NOT NULL,
    items JSONB DEFAULT '[]'::jsonb,
    total_amount NUMERIC DEFAULT 0,
    paid_amount NUMERIC DEFAULT 0,
    due_amount NUMERIC DEFAULT 0,
    status TEXT NOT NULL, -- 'Paid', 'Partial', 'Due'
    month TEXT,
    received_by TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Teacher Salaries
CREATE TABLE IF NOT EXISTS public.salary_data (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    month TEXT NOT NULL,
    payment_date TEXT,
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(academic_year, teacher_id, month)
);

-- School Expenditures
CREATE TABLE IF NOT EXISTS public.expenditures_data (
    id TEXT PRIMARY KEY,
    academic_year TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    date TEXT NOT NULL,
    remarks TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==========================================
-- 3. ACADEMIC TABLES
-- ==========================================

-- Student Marks Entry
CREATE TABLE IF NOT EXISTS public.marks_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year TEXT NOT NULL,
    class_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    term TEXT NOT NULL,
    marks_obtained NUMERIC DEFAULT 0,
    max_marks NUMERIC DEFAULT 100,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(academic_year, student_id, subject_id, term)
);

-- Student Attendance
CREATE TABLE IF NOT EXISTS public.attendance_data (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    class_id TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    month TEXT NOT NULL,
    day INTEGER NOT NULL,
    status TEXT NOT NULL, -- 'Present', 'Absent', 'Leave'
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(academic_year, student_id, month, day)
);

-- ==========================================
-- 4. SECURITY & POLICIES (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.app_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenditures_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marks_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_data ENABLE ROW LEVEL SECURITY;

-- Create Permissive Policies (Allow all for development)
-- Replace 'true' with proper auth checks for production
CREATE POLICY "Allow all" ON public.app_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.students_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.teachers_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.invoices_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.salary_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.expenditures_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.marks_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.attendance_data FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 5. PERFORMANCE INDEXES
-- ==========================================

CREATE INDEX idx_students_year ON public.students_data(academic_year);
CREATE INDEX idx_students_class ON public.students_data(current_class);
CREATE INDEX idx_teachers_year ON public.teachers_data(academic_year);
CREATE INDEX idx_invoices_student ON public.invoices_data(student_id);
CREATE INDEX idx_invoices_year ON public.invoices_data(academic_year);
CREATE INDEX idx_marks_student ON public.marks_data(student_id);
CREATE INDEX idx_attendance_date ON public.attendance_data(academic_year, month, day);

-- ==========================================
-- 6. AUTOMATIC UPDATED_AT TRIGGER
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER tr_app_entries_upd BEFORE UPDATE ON public.app_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_students_upd BEFORE UPDATE ON public.students_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_teachers_upd BEFORE UPDATE ON public.teachers_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_invoices_upd BEFORE UPDATE ON public.invoices_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_salary_upd BEFORE UPDATE ON public.salary_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_expenditures_upd BEFORE UPDATE ON public.expenditures_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_marks_upd BEFORE UPDATE ON public.marks_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_attendance_upd BEFORE UPDATE ON public.attendance_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
