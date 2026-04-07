import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, Search, FolderLock, UserCircle, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import axios from '../api/axios';

const AdminProjectAuth = () => {
  // --- 1. 상태 관리 ---
  const [users, setUsers] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [projectList, setProjectList] = useState([]);
  const [loading, setLoading] = useState({ users: false, projects: false, saving: false });

  // --- 2. 데이터 페칭 로직 ---
  
  // 멤버 목록 가져오기
  const fetchUsers = useCallback(async () => {
    setLoading(prev => ({ ...prev, users: true }));
    try {
      // 401 에러 방지를 위해 헤더에 토큰이 포함되어야 합니다.
      // (../api/axios.js 에서 인터셉터로 처리 중이라면 이 부분은 생략 가능합니다)
      const response = await axios.get('/users?size=100'); 
      if (response.data.success) {
        setUsers(response.data.data.content || []);
      }
    } catch (error) {
      console.error("멤버 목록 로드 실패:", error);
      if (error.response?.status === 401) {
        alert("인증 세션이 만료되었습니다. 다시 로그인해주세요.");
        // window.location.href = '/login'; // 필요 시 활성화
      }
    } finally {
      setLoading(prev => ({ ...prev, users: false }));
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 특정 사용자의 프로젝트 권한 목록 가져오기
  const fetchUserPermissions = async (user) => {
    if (loading.projects) return; // 중복 호출 방지
    
    setSelectedUser(user);
    setLoading(prev => ({ ...prev, projects: true }));
    
    try {
      const response = await axios.get(`/projects/permissions/${user.id}`);
      if (response.data.success) {
        setProjectList(response.data.data || []);
      }
    } catch (error) {
      console.error("권한 로드 실패:", error);
      alert("해당 사용자의 프로젝트 권한 정보를 가져오지 못했습니다.");
      setProjectList([]); // 에러 시 목록 초기화
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  };

  // --- 3. 핸들러 ---

  // 프로젝트 권한 토글 (로컬 상태 업데이트)
  const handleAuthToggle = (projectId) => {
    setProjectList(prev => prev.map(proj => 
      proj.projectId === projectId ? { ...proj, assigned: !proj.assigned } : proj
    ));
  };

  // 변경된 권한 저장
  const handleSaveAuth = async () => {
    if (!selectedUser || loading.saving) return;

    if (!window.confirm(`${selectedUser.name}님의 프로젝트 권한을 변경하시겠습니까?`)) return;

    setLoading(prev => ({ ...prev, saving: true }));
    
    const payload = {
      assignedProjectIds: projectList
        .filter(p => p.assigned)
        .map(p => p.projectId)
    };

    try {
      const response = await axios.put(`/projects/permissions/${selectedUser.id}`, payload);
      if (response.data.success) {
        alert(`${selectedUser.name}님의 권한 설정이 완료되었습니다.`);
        fetchUsers(); // 목록 새로고침 (필요 시)
      }
    } catch (error) {
      console.error("저장 실패:", error);
      alert(error.response?.data?.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(prev => ({ ...prev, saving: false }));
    }
  };

  // --- 4. 필터링 로직 ---
  const filteredUsers = users.filter(user => {
    const isNotAdmin = user.role !== 'ADMIN';
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    return isNotAdmin && matchesSearch;
  });

  return (
    <div className="animate-fadeIn p-6 bg-gray-50/30 min-h-screen">
      <header className="mb-8">
        <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <ShieldCheck className="text-blue-600" size={28} /> 프로젝트 권한 관리
        </h2>
        <p className="text-sm text-gray-400 mt-1 ml-1">관리자를 제외한 모든 멤버의 프로젝트 접근 권한을 일괄 관리합니다.</p>
      </header>

      <div className="grid grid-cols-12 gap-8 max-w-7xl mx-auto">
        
        {/* 왼쪽: 사용자 목록 */}
        <section className="col-span-5 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white sticky top-0 z-10">
            <h3 className="font-bold text-gray-700 flex items-center gap-2">
              <UserCircle size={18} className="text-blue-500" /> 멤버 목록
              <span className="text-xs font-normal text-gray-400 ml-1">({filteredUsers.length}명)</span>
            </h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-300" size={16} />
              <input 
                type="text" 
                placeholder="이름 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs focus:ring-2 focus:ring-blue-100 outline-none w-40 transition-all focus:w-48"
              />
            </div>
          </div>

          <div className="overflow-y-auto h-[550px] custom-scroll">
            {loading.users ? (
              <div className="flex flex-col items-center justify-center p-20 gap-3">
                <Loader2 className="animate-spin text-blue-500" size={32} />
                <p className="text-sm text-gray-400">멤버 정보를 불러오는 중...</p>
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div 
                  key={user.id}
                  onClick={() => fetchUserPermissions(user)}
                  className={`p-4 mx-4 my-2 rounded-xl cursor-pointer transition-all flex items-center justify-between border
                    ${selectedUser?.id === user.id 
                      ? 'bg-blue-50 border-blue-200 shadow-sm' 
                      : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-inner
                      ${selectedUser?.id === user.id ? 'bg-blue-500' : 'bg-gray-300'}`}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">{user.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {user.departmentName || '소속 없음'} · {user.position || '직책 없음'}
                      </p>
                    </div>
                  </div>
                  {selectedUser?.id === user.id && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-glow" />}
                </div>
              ))
            ) : (
              <div className="text-center py-24 text-gray-400 text-sm">
                {searchTerm ? '검색 결과와 일치하는 멤버가 없습니다.' : '표시할 멤버가 없습니다.'}
              </div>
            )}
          </div>
        </section>

        {/* 오른쪽: 권한 설정 섹션 */}
        <section className="col-span-7 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-white sticky top-0 z-10">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-1">
              <FolderLock size={18} className="text-orange-500" /> 프로젝트 권한 설정
            </h3>
            {selectedUser ? (
              <p className="text-xs text-blue-500 font-medium">
                <span className="font-black">[{selectedUser.name}]</span> 멤버의 접근 권한을 편집하고 있습니다.
              </p>
            ) : (
              <p className="text-xs text-gray-400">목록에서 멤버를 선택하여 권한을 수정하세요.</p>
            )}
          </div>

          <div className={`flex-1 p-6 space-y-3 overflow-y-auto h-[480px] custom-scroll transition-opacity duration-300 ${!selectedUser && 'opacity-40 pointer-events-none'}`}>
            {loading.projects ? (
              <div className="flex flex-col items-center justify-center p-20 gap-3">
                <Loader2 className="animate-spin text-orange-500" size={32} />
                <p className="text-sm text-gray-400">권한 정보를 조회 중입니다...</p>
              </div>
            ) : projectList.length > 0 ? (
              projectList.map(project => (
                <div 
                  key={project.projectId}
                  onClick={() => handleAuthToggle(project.projectId)}
                  className={`flex items-center justify-between p-5 rounded-xl border transition-all cursor-pointer
                    ${project.assigned 
                      ? 'border-blue-100 bg-blue-50/30 hover:bg-blue-50/50' 
                      : 'border-gray-100 bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-gray-700">{project.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase
                        ${project.assigned ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                        {project.status || 'ING'}
                      </span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-3 text-xs font-bold transition-colors ${project.assigned ? 'text-blue-600' : 'text-gray-300'}`}>
                    <span className="tracking-tighter">{project.assigned ? '접근 허용' : '접근 차단'}</span>
                    {project.assigned ? (
                      <CheckCircle2 size={24} className="fill-blue-500 text-white" />
                    ) : (
                      <Circle size={24} className="text-gray-200" />
                    )}
                  </div>
                </div>
              ))
            ) : selectedUser ? (
              <div className="text-center py-24 text-gray-400 text-sm">할당 가능한 프로젝트가 없습니다.</div>
            ) : null}
          </div>

          <div className="p-6 bg-gray-50/80 border-t border-gray-100">
            <button 
              onClick={handleSaveAuth}
              disabled={!selectedUser || loading.saving || loading.projects}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-200/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading.saving ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>설정 저장 중...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  <span>권한 변경 사항 저장</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminProjectAuth;