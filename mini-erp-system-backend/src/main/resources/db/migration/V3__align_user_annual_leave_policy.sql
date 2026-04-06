-- Align existing user annual leave values with position policy.
-- Policy: 사원 14, 대리 16, 과장 17, 팀장 18, 관리소장/관리자 19

UPDATE users
SET total_annual_leave = CASE
    WHEN REPLACE(position_name, ' ', '') = '사원' THEN 14.0
    WHEN REPLACE(position_name, ' ', '') = '대리' THEN 16.0
    WHEN REPLACE(position_name, ' ', '') = '과장' THEN 17.0
    WHEN REPLACE(position_name, ' ', '') = '팀장' THEN 18.0
    WHEN REPLACE(position_name, ' ', '') IN ('관리소장', '관리자') THEN 19.0
    ELSE 14.0
END;

UPDATE users
SET remaining_annual_leave = GREATEST(0, total_annual_leave - used_annual_leave);

