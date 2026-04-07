import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../api/axios'; 
import { 
  LayoutDashboard, FileText, Calendar, Send, ClipboardList, 
  User, LogOut, Bell, CheckCircle2, ChevronRight 
} from 'lucide-react';

// 페이지 컴포넌트 (실제 파일 경로를 확인하세요)
import CalendarPage from './CalendarPage'; 
import ProfilePage from './ProfilePage'; 
import LeaveApplyPage from './LeaveApplyPage';   
import LeaveHistoryPage from './LeaveHistoryPage'; 
import ProjectPage from './ProjectPage'; 

const UserDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard': return <DashboardHome user={user} setActiveMenu={setActiveMenu} />;
      case 'projects': return <ProjectPage />;
      case 'calendar': return <CalendarPage onNavigateToApply={() => setActiveMenu('leave-apply')} />;
      case 'leave-apply': return <LeaveApplyPage onNavigateToHistory={() => setActiveMenu('leave-history')} />;
      case 'leave-history': return <LeaveHistoryPage onNavigateToApply={() => setActiveMenu('leave-apply')} />;
      default: return <div className="p-10 text-center text-gray-400">화면 준비 중...</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
        <div className="p-6 flex items-center gap-2 text-blue-600 font-bold text-xl cursor-pointer" onClick={() => setActiveMenu('dashboard')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">W</div>
          WorkFlow
        </div>
        <div className="px-6 py-4 mb-4 cursor-pointer" onClick={() => setIsProfileOpen(true)}>
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-800 truncate">{user?.name || '사용자'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.departmentName || '개발팀'} · {user?.position || '사원'}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          <NavItem icon={<LayoutDashboard size={18}/>} label="대시보드" active={activeMenu === 'dashboard'} onClick={() => setActiveMenu('dashboard')} />
          <NavItem icon={<FileText size={18}/>} label="내 프로젝트/업무" active={activeMenu === 'projects'} onClick={() => setActiveMenu('projects')} />
          <NavItem icon={<Calendar size={18}/>} label="캘린더" active={activeMenu === 'calendar'} onClick={() => setActiveMenu('calendar')} />
          <NavItem icon={<Send size={18}/>} label="연차/특근 신청" active={activeMenu === 'leave-apply'} onClick={() => setActiveMenu('leave-apply')} />
          <NavItem icon={<ClipboardList size={18}/>} label="신청 내역" active={activeMenu === 'leave-history'} onClick={() => setActiveMenu('leave-history')} />
          <NavItem icon={<User size={18}/>} label="내 프로필" active={isProfileOpen} onClick={() => setIsProfileOpen(true)} />
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all w-full p-2 rounded-lg group">
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> 
            <span className="text-sm font-medium">로그아웃</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8">
        {renderContent()}
      </main>
      <ProfilePage isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} user={user} />
    </div>
  );
};

const DashboardHome = ({ user, setActiveMenu }) => {
  const [myProjects, setMyProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leave, setLeave] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectRes, taskRes, leaveRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/leave/balance') // 추가
      ]);

      const allProjects = projectRes.data?.data || [];
      const allTasks = taskRes.data?.data || [];

      setMyProjects(allProjects);
      setMyTasks(allTasks);
      // 3. [추가] 연차 데이터가 잘 왔다면 상태 업데이트!
    if (leaveRes.data?.success) {
      setLeave(leaveRes.data.data.remainingAnnualLeave);
    }
      console.log("프로젝트 데이터:", allProjects);
      console.log("업무 데이터:", allTasks);
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = {
    projectCount: myProjects.length,
    completedTasks: myTasks.filter(t => t.taskState === 'DONE').length,
    pendingTasks: myTasks.filter(t => t.taskState === 'TODO').length,
    leave: leave//user?.remainingAnnualLeave
  };

  if (loading) return <div className="p-20 text-center text-gray-400">데이터 로드 중...</div>;

  return (
    <>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">대시보드</h1>
          <p className="text-gray-500 text-sm mt-1">안녕하세요, <span className="font-semibold text-gray-700">{user?.name}님!</span> 👋</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full relative">
            <Bell size={20}/><span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <div className="w-10 h-10 bg-blue-800 text-white rounded-lg flex items-center justify-center font-bold">
            {user?.name?.charAt(0)}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon="💼" title={stats.projectCount} sub="전체 프로젝트" color="orange" tag="조회된 수" />
        <StatCard icon="✅" title={stats.completedTasks} sub="완료 업무" color="green" tag="상태: DONE" />
        <StatCard icon="🕒" title={stats.pendingTasks} sub="진행 업무" color="blue" tag="상태: TODO" />
        <StatCard icon="📅" title={`${stats.leave}일`} sub="잔여 연차" color="pink" tag="기본 정보" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 업무 리스트 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">📌 할 일 리스트</h3>
            <button onClick={() => setActiveMenu('projects')} className="text-blue-600 text-xs font-semibold flex items-center gap-1">
              상세보기 <ChevronRight size={14}/>
            </button>
          </div>
          <div className="space-y-3">
            {myTasks.length > 0 ? (
              myTasks.map((task, index) => (
                <TodoItem 
                  key={task.id ? `task-${task.id}` : `task-idx-${index}`} // id가 없을 경우 대비
                  title={task.taskTitle} 
                  project={`Project ID: ${task.projectId}`} 
                  status={task.taskState} 
                  dDay={task.endDate || "2026-04-10"}
                  active={task.taskState === 'TODO'}
                />
              ))
            ) : (
              <div className="text-center py-20 text-gray-400 text-sm">업무가 없습니다.</div>
            )}
          </div>
        </div>

        {/* 프로젝트 진행도 - Key 및 Undefined 수정 */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-800 mb-6">📈 프로젝트 진행도</h3>
          <div className="space-y-6 flex-1">
            {myProjects.length > 0 ? (
              myProjects.map((project, index) => (
                <ProgressItem 
                  // 고유 ID가 없을 경우 index를 섞어서 절대 중복되지 않게 생성
                  key={project.id ? `project-${project.id}` : `project-idx-${index}`} 
                  // 제목이 없을 경우 id나 index로 대체
                  title={project.projectTitle || project.title || `프로젝트 (ID:${project.id || index})`} 
                  percent={project.progress || 0} 
                  color="bg-blue-500" 
                  status={project.status || "READY"} 
                />
              ))
            ) : (
              <div className="text-center py-20 text-gray-400 text-sm">프로젝트가 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/* --- UI 컴포넌트 동일 --- */
const NavItem = ({ icon, label, active, onClick }) => (
  <div onClick={onClick} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-500 hover:bg-gray-50'}`}>
    {icon} <span className="text-sm">{label}</span>
  </div>
);

const StatCard = ({ icon, title, sub, color, tag }) => {
  const colors = { orange: 'bg-orange-50 text-orange-600', green: 'bg-emerald-50 text-emerald-600', blue: 'bg-blue-50 text-blue-600', pink: 'bg-pink-50 text-pink-600' };
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
      <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-2xl ${colors[color]}`}>{icon}</div>
      <div className="text-3xl font-black text-gray-800">{title}</div>
      <p className="text-gray-500 text-sm mt-1">{sub}</p>
      <div className="mt-4 pt-4 border-t border-gray-50 text-[10px] font-bold text-gray-400">{tag}</div>
    </div>
  );
};

const TodoItem = ({ title, project, status, dDay, active }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl border ${active ? 'border-blue-100 bg-blue-50/20' : 'border-gray-50'}`}>
    <div className="flex items-center gap-3 overflow-hidden">
      <div className={`w-5 h-5 border-2 rounded-full flex-shrink-0 ${status === 'DONE' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
        {status === 'DONE' && <CheckCircle2 size={16} className="text-white"/>}
      </div>
      <div className="overflow-hidden">
        <p className={`text-sm font-bold truncate ${status === 'DONE' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{title}</p>
        <p className="text-[10px] text-gray-400">{project}</p>
      </div>
    </div>
    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white text-blue-500 border border-blue-100 shrink-0 shadow-sm">{dDay}</span>
  </div>
);

const ProgressItem = ({ title, percent, color, status }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-bold text-gray-700">{title}</span>
      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{status}</span>
    </div>
    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
      <div className={`${color} h-full transition-all duration-700`} style={{ width: `${percent}%` }}></div>
    </div>
  </div>
);

export default UserDashboard;