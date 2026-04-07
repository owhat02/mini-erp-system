import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, User, Mail, ShieldCheck, Lock, CheckCircle2, Eye, EyeOff, LogIn } from 'lucide-react';
import axios from '@/api/axios';

/**
 * [컴포넌트] Stepper
 * 현재 진행 단계를 시각적으로 표시합니다.
 */
const Stepper = ({ currentStep }) => (
  <div className="flex items-center justify-between w-full max-w-[320px] mx-auto mb-10">
    {[1, 2, 3].map((num) => (
      <div key={num} className="flex items-center flex-1 last:flex-none">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
          currentStep >= num ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
        } ${currentStep === num ? 'ring-4 ring-blue-50 shadow-sm' : ''}`}>
          {currentStep > num ? <CheckCircle2 className="w-4 h-4" /> : num}
        </div>
        {num < 3 && (
          <div className={`h-[0.5px] flex-1 mx-2 ${currentStep > num ? 'bg-blue-600' : 'bg-gray-100'}`} />
        )}
      </div>
    ))}
  </div>
);

export default function FindPwPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1:본인확인, 2:인증번호, 3:재설정, 4:완료
  const [showPw, setShowPw] = useState(false);
  
  // 입력 폼 상태 관리
  const [formData, setFormData] = useState({
    userId: '', // ID 확인용 (API에 따라 사용 여부 결정)
    email: '',
    authCode: '',
    newPassword: '',
    confirmPassword: '',
    resetProof: '' // [추가] 비밀번호 재설정 권한 증명 토큰
  });

  // 입력값 변경 핸들러
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  /**
   * [기능] STEP 1: 사용자 확인 및 인증번호 발송
   * ProfilePage의 handleRequestAuth 로직 적용
   */
  const handleVerifyUser = async () => {
    if (!formData.email) return alert("이메일을 입력해주세요.");
    
    try {
      // 백엔드 엔드포인트에 맞춰 POST 요청
      const response = await axios.post('/auth/password/reset/request', { 
        email: formData.email 
        // 필요 시 userId: formData.userId 추가 가능
      });
      
      if (response.data.success) {
        alert("인증번호가 발송되었습니다.");
        setStep(2);
      }
    } catch (error) {
      console.error("인증번호 발송 실패:", error);
      alert(error.response?.data?.message || "일치하는 사용자 정보가 없거나 발송에 실패했습니다.");
    }
  };

  /**
   * [기능] STEP 2: 인증번호 확인
   * ProfilePage의 handleVerifyCode 로직 적용
   */
  const handleVerifyCode = async () => {
    try {
      const response = await axios.post('/auth/password/reset/verify', { 
        email: formData.email, 
        verificationCode: formData.authCode 
      });

      if (response.data.success) {
        // 서버에서 준 resetProof 토큰 저장
        setFormData(prev => ({ ...prev, resetProof: response.data.data.resetProof }));
        setStep(3);
      }
    } catch (error) {
      console.error("인증번호 확인 실패:", error);
      alert(error.response?.data?.message || "인증번호가 올바르지 않습니다.");
    }
  };

  /**
   * [기능] STEP 2-1: 인증번호 재발송
   */
  const handleResendCode = () => {
    setFormData(prev => ({ ...prev, authCode: '' }));
    handleVerifyUser(); // 기존 발송 로직 재호출
  };

  /**
   * [기능] STEP 3: 실제 비밀번호 재설정
   * ProfilePage의 handleConfirmReset 로직 적용
   */
  const handleResetPassword = async () => {
    // 유효성 검사
    if (formData.newPassword !== formData.confirmPassword) {
      alert("비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    if (formData.newPassword.length < 4) {
      alert("비밀번호는 최소 4자 이상이어야 합니다.");
      return;
    }

    try {
      // resetProof와 함께 새 비밀번호 전송
      const response = await axios.post('/auth/password/reset/confirm', {
        resetProof: formData.resetProof,
        newPassword: formData.newPassword,
        newPasswordConfirm: formData.confirmPassword
      });

      if (response.data.success) {
        setStep(4);
      }
    } catch (error) {
      console.error("비밀번호 변경 실패:", error);
      alert(error.response?.data?.message || "비밀번호 변경에 실패했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6 py-12 text-gray-900">
      <div className="bg-white p-10 rounded-3xl shadow-lg w-full max-w-[520px]">
        
        {/* 공통 헤더 */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-lg shadow-blue-100">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-950 mb-1">WorkFlow</h1>
          <p className="text-sm text-gray-500 font-medium">비밀번호를 재설정할 수 있어요</p>
        </div>

        {/* 스테퍼 표시 (완료 단계 제외) */}
        {step < 4 && <Stepper currentStep={step} />}

        {/* STEP 1: 본인확인 */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold text-gray-950 mb-1">본인 확인</h2>
              <p className="text-sm text-gray-500">정보를 입력하고 인증번호를 받으세요</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 tracking-tight">아이디</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    id="userId" type="text" onChange={handleChange} placeholder="아이디" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all" 
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 tracking-tight">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    id="email" type="email" onChange={handleChange} placeholder="가입 시 입력한 이메일" 
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all" 
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={handleVerifyUser} 
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              인증번호 발송
            </button>
          </div>
        )}

        {/* STEP 2: 인증번호 입력 */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold text-gray-950 mb-1">인증번호 입력</h2>
              <p className="text-sm text-gray-500">{formData.email}로 발송된 번호를 입력하세요</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl flex items-center gap-3 border border-blue-100">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <p className="text-xs text-blue-600 font-medium">인증번호가 발송되었습니다.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 tracking-tight">인증번호</label>
              <div className="flex gap-2">
                <input 
                  id="authCode" type="text" maxLength={6} value={formData.authCode} onChange={handleChange} 
                  placeholder="000000" 
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-center tracking-[0.5em] font-bold outline-none focus:border-blue-400" 
                />
                <button 
                  onClick={handleResendCode}
                  className="px-4 py-3 border border-gray-200 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50 hover:text-blue-600 transition-all"
                >
                  재발송
                </button>
              </div>
            </div>
            <button 
              onClick={handleVerifyCode} 
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              인증 확인
            </button>
          </div>
        )}

        {/* STEP 3: 새 비밀번호 설정 */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="text-xl font-bold text-gray-950 mb-1">새 비밀번호 설정</h2>
              <p className="text-sm text-gray-500">로그인에 사용할 새 비밀번호를 입력하세요</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 tracking-tight">새 비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    id="newPassword" type={showPw ? "text" : "password"} onChange={handleChange} 
                    placeholder="8자 이상 권장" 
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all" 
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 tracking-tight">새 비밀번호 확인</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    id="confirmPassword" type={showPw ? "text" : "password"} onChange={handleChange} 
                    placeholder="비밀번호 재입력" 
                    className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all" 
                  />
                </div>
              </div>
            </div>
            <button 
              onClick={handleResetPassword} 
              className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
            >
              비밀번호 재설정
            </button>
          </div>
        )}

        {/* STEP 4: 완료 */}
        {step === 4 && (
          <div className="flex flex-col items-center py-6 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 relative">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <div className="absolute -top-1 -right-1 text-2xl">🎉</div>
            </div>
            <h2 className="text-2xl font-bold text-gray-950 mb-2">재설정 완료!</h2>
            <p className="text-sm text-gray-500 mb-10">새 비밀번호로 안전하게 로그인하세요.</p>
            <button 
              onClick={() => navigate('/login')} 
              className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" /> 로그인하러 가기
            </button>
          </div>
        )}

        {/* 하단 링크 */}
        {step < 4 && (
          <div className="mt-10 flex justify-center gap-4 text-[11px] text-gray-400 border-t pt-6">
            <button onClick={() => navigate('/login')} className="hover:text-blue-600">로그인</button>
            <span className="text-gray-200">|</span>
            <button onClick={() => navigate('/find-id')} className="hover:text-blue-600">아이디 찾기</button>
            <span className="text-gray-200">|</span>
            <button onClick={() => navigate('/signup')} className="hover:text-blue-600 font-bold">회원가입</button>
          </div>
        )}
      </div>
    </div>
  );
}