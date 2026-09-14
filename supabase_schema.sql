-- ==========================================================
-- Classroom Stock (학급 모의 주식) Supabase 데이터베이스 구축 스크립트
-- 
-- 사용 방법:
-- 1. Supabase (https://supabase.com) 로그인 후 프로젝트 대시보드로 이동
-- 2. 왼쪽 메뉴에서 'SQL Editor' 클릭
-- 3. 'New query' 클릭 후 이 파일의 전체 내용을 붙여넣기
-- 4. 오른쪽 아래 녹색 'Run' 버튼 클릭!
-- ==========================================================

-- 1. 학생 테이블 (students) 생성
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    student_no INTEGER NOT NULL,
    name TEXT NOT NULL,
    pin TEXT NOT NULL DEFAULT '1234',
    seed_money BIGINT NOT NULL DEFAULT 1000000,
    cash BIGINT NOT NULL DEFAULT 1000000,
    portfolio JSONB NOT NULL DEFAULT '{}'::jsonb,
    trade_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 관리자 및 시스템 설정 테이블 (settings) 생성
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    admin_password TEXT NOT NULL DEFAULT 'admin',
    default_seed_money BIGINT NOT NULL DEFAULT 1000000,
    market_status TEXT NOT NULL DEFAULT 'OPEN',
    allow_trading BOOLEAN NOT NULL DEFAULT true,
    auto_fluctuate_custom BOOLEAN NOT NULL DEFAULT false,
    fluctuation_interval_minutes INTEGER NOT NULL DEFAULT 3,
    fluctuation_range_percent INTEGER NOT NULL DEFAULT 5,
    custom_stocks JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 보안 정책(RLS) 활성화 및 접근 권한 설정
-- 프론트엔드 및 Vercel 서버리스에서 자유롭게 접근할 수 있도록 전체 허용 정책 등록
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 기존 정책이 있다면 충돌 방지를 위해 삭제 후 재등록
DROP POLICY IF EXISTS "Allow all access to students" ON public.students;
CREATE POLICY "Allow all access to students" ON public.students
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to settings" ON public.settings;
CREATE POLICY "Allow all access to settings" ON public.settings
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. 기본 설정 데이터 삽입 (이미 있으면 건너뜀)
INSERT INTO public.settings (
    id, admin_password, default_seed_money, market_status, allow_trading,
    auto_fluctuate_custom, fluctuation_interval_minutes, fluctuation_range_percent, custom_stocks
) VALUES (
    'global', 'admin', 1000000, 'OPEN', true,
    false, 3, 5, '[]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- 5. 기본 학생 10명 초기 데이터 삽입 (테이블이 비어있을 때만 삽입)
INSERT INTO public.students (id, student_no, name, pin, seed_money, cash, portfolio, trade_history)
SELECT * FROM (VALUES
    ('stu-1', 1, '김민준', '1234', 1000000::bigint, 1000000::bigint, '{}'::jsonb, '[]'::jsonb),
    ('stu-2', 2, '이서연', '1234', 1000000::bigint, 1000000::bigint, '{}'::jsonb, '[]'::jsonb),
    ('stu-3', 3, '박도윤', '1234', 1000000::bigint, 1000000::bigint, '{}'::jsonb, '[]'::jsonb),
    ('stu-4', 4, '정예은', '1234', 1000000::bigint, 1000000::bigint, '{}'::jsonb, '[]'::jsonb),
    ('stu-5', 5, '최현우', '1234', 1000000::bigint, 1000000::bigint, '{}'::jsonb, '[]'::jsonb),
    ('stu-6', 6, '강지민', '1234', 1000000::bigint, 1000000::bigint, '{}'::jsonb, '[]'::jsonb),
    ('stu-7', 7, '윤서진', '1234', 1000000::bigint, 1000000::bigint, '{}'::jsonb, '[]'::jsonb),
    ('stu-8', 8, '한수빈', '1234', 1000000::bigint, 1000000::bigint, '{}'::jsonb, '[]'::jsonb),
    ('stu-9', 9, '오준서', '1234', 1000000::bigint, 1000000::bigint, '{}'::jsonb, '[]'::jsonb),
    ('stu-10', 10, '송다은', '1234', 1000000::bigint, 1000000::bigint, '{}'::jsonb, '[]'::jsonb)
) AS v(id, student_no, name, pin, seed_money, cash, portfolio, trade_history)
WHERE NOT EXISTS (SELECT 1 FROM public.students LIMIT 1);
