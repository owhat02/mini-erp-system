import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Mail, CheckCircle2, LogIn } from 'lucide-react';
import api from '@/api/axios'; // [수정] 회원가입에서 사용한 동일한 api 인스턴스 사용

export default function FindIdPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [foundId, setFoundId] = useState('');
  
  // 폼 데이터 상태
  const [formData, setFormData] = useState({ 
    userName: '', 
    email: '' 
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  /**
   * [수정] 아이디 찾기 제출 핸들러
   * 명세서 규격: POST /api/v1/auth/find-id/request
   */
  const handleFindId = async (e) => {
    e.preventDefault();
    
    try {
      /**
       * [중요] 명세서 데이터 매핑
       * - method: POST
       * - body: { name: "사용자이름", email: "이메일" }
       */
      const response = await api.post('/auth/find-id/request', {
        name: formData.userName, // 명세서에서 요구하는 필드명은 'name'입니다.
        email: formData.email
      });

      // 서버 응답 구조: { success: true, data: { loginId: "string" }, ... }
      if (response.data && response.data.success) {
        // 명세서의 리턴 필드명인 'loginId'를 추출합니다.
        setFoundId(response.data.data.loginId);
        setStep(2);
      } else {
        alert(response.data.message || "일치하는 정보를 찾을 수 없습니다.");
      }
    } catch (error) {
      // 회원가입 페이지와 동일한 에러 처리 방식 적용
      const errorMsg = error.response?.data?.message || "아이디를 찾는 중 오류가 발생했습니다.";
      alert(errorMsg);
      console.error("Find ID Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 py-12 text-gray-900">
      <div className="bg-white p-10 rounded-3xl shadow-lg w-full max-w-[520px]">
        
        {/* 헤더 부분 */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-lg shadow-blue-100">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-950 mb-1">WorkFlow</h1>
          <p className="text-sm text-gray-500 font-medium">가입할 때 입력한 정보를 알려주세요</p>
        </div>

        {/* STEP 1: 정보 입력 */}
        {step === 1 && (
          <form onSubmit={handleFindId} className="space-y-6 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">이름</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    id="userName" 
                    type="text" 
                    value={formData.userName}
                    onChange={handleChange} 
                    placeholder="성함 입력" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" 
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={handleChange} 
                    placeholder="가입 시 등록한 이메일" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400" 
                    required
                  />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">
              아이디 찾기
            </button>
          </form>
        )}

        {/* STEP 2: 결과 표시 */}
        {step === 2 && (
          <div className="flex flex-col items-center py-4 animate-in zoom-in duration-500">
            <h2 className="text-xl font-bold text-gray-950 mb-1">아이디를 찾았어요!</h2>
            <p className="text-sm text-gray-500 mb-8">입력하신 정보와 일치하는 계정입니다</p>
            
            <div className="w-full bg-gray-50 p-7 rounded-2xl text-center mb-8 border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <span className="text-[11px] text-gray-400 font-bold uppercase block mb-2 tracking-wider">검색된 아이디</span>
              <span className="text-2xl font-black text-gray-900 tracking-tight">{foundId}</span>
            </div>

            <button onClick={() => navigate('/login')} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 shadow-lg transition-all flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" /> 로그인하러 가기
            </button>
          </div>
        )}

        {/* 하단 푸터 */}
        <div className="mt-10 flex justify-center gap-4 text-[11px] text-gray-400 border-t pt-6">
          <button onClick={() => navigate('/login')} className="hover:text-blue-600">로그인</button>
          <span className="text-gray-200">|</span>
          <button onClick={() => navigate('/find-pw')} className="hover:text-blue-600">비밀번호 찾기</button>
          <span className="text-gray-200">|</span>
          <button onClick={() => navigate('/signup')} className="hover:text-blue-600 font-bold">회원가입</button>
        </div>
      </div>
    </div>
  );
}