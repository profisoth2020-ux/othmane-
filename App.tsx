
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  FileText, 
  LogOut, 
  Plus, 
  TrendingUp,
  Settings,
  DollarSign,
  UserPlus,
  LogIn,
  Edit2,
  Trash2,
  X,
  Layers,
  Save,
  Printer,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { User, UserRole, Domain, SubCategory, Assessment } from './types';
import { INITIAL_DOMAINS, INITIAL_STAFF, SUB_CATEGORIES } from './constants';
import { getPerformanceSummary } from './services/geminiService';

// --- Helpers for Persistence ---
const STORAGE_KEYS = {
  USERS: 'caregiver_users',
  DOMAINS: 'caregiver_domains',
  SUB_CATEGORIES: 'caregiver_subcategories',
  ASSESSMENTS: 'caregiver_assessments'
};

const saveData = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));
const loadData = (key: string, fallback: any) => {
  const saved = localStorage.getItem(key);
  try {
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
};

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'
    }`}
  >
    <Icon size={20} />
    <span className="font-semibold">{label}</span>
  </button>
);

const StatsCard = ({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color: string }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-gray-500 text-sm mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} className="text-white" />
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // Auth Form State
  const [authForm, setAuthForm] = useState({ 
    username: '', 
    password: '', 
    name: '', 
    role: UserRole.STAFF 
  });
  
  // Data State with Hydration
  const [users, setUsers] = useState<User[]>(() => loadData(STORAGE_KEYS.USERS, INITIAL_STAFF));
  const [domains, setDomains] = useState<Domain[]>(() => loadData(STORAGE_KEYS.DOMAINS, INITIAL_DOMAINS));
  const [subCategories, setSubCategories] = useState<SubCategory[]>(() => loadData(STORAGE_KEYS.SUB_CATEGORIES, SUB_CATEGORIES));
  const [assessments, setAssessments] = useState<Assessment[]>(() => loadData(STORAGE_KEYS.ASSESSMENTS, []));
  
  const [aiSummary, setAiSummary] = useState<string>('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Persistence Effects
  useEffect(() => saveData(STORAGE_KEYS.USERS, users), [users]);
  useEffect(() => saveData(STORAGE_KEYS.DOMAINS, domains), [domains]);
  useEffect(() => saveData(STORAGE_KEYS.SUB_CATEGORIES, subCategories), [subCategories]);
  useEffect(() => saveData(STORAGE_KEYS.ASSESSMENTS, assessments), [assessments]);

  // Form States
  const [newDomain, setNewDomain] = useState({ name: '', price: 0 });
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  
  const [newSubCategory, setNewSubCategory] = useState({ domainId: '', title: '' });
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);

  const [assessmentForm, setAssessmentForm] = useState({
    staffId: '',
    domainId: '',
    subCategoryId: '',
    points: 0
  });

  // Staff Management Form State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [staffForm, setStaffForm] = useState({
    name: '',
    username: '',
    role: UserRole.STAFF,
    password: ''
  });

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Authentication Logic
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegisterMode) {
      if (!authForm.username || !authForm.password || !authForm.name) {
        alert("يرجى ملء كافة الحقول");
        return;
      }
      if (users.find(u => u.username === authForm.username)) {
        alert("اسم المستخدم موجود مسبقاً");
        return;
      }
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: authForm.name,
        username: authForm.username,
        password: authForm.password,
        role: authForm.role
      };
      setUsers([...users, newUser]);
      setCurrentUser(newUser);
      alert("تم إنشاء الحساب بنجاح");
    } else {
      const user = users.find(u => u.username === authForm.username && u.password === authForm.password);
      const legacyUser = users.find(u => u.username === authForm.username && !u.password);
      const authenticatedUser = user || legacyUser;

      if (authenticatedUser) {
        setCurrentUser(authenticatedUser);
      } else {
        alert("اسم المستخدم أو كلمة المرور غير صحيحة");
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
    setAuthForm({ username: '', password: '', name: '', role: UserRole.STAFF });
  };

  // Staff Management Handlers
  const handleSaveStaff = () => {
    if (!staffForm.name || !staffForm.username) {
      alert("يرجى إكمال البيانات");
      return;
    }

    if (editingStaff) {
      setUsers(users.map(u => u.id === editingStaff.id ? { ...u, ...staffForm } : u));
      alert("تم تحديث بيانات الموظف");
    } else {
      if (users.find(u => u.username === staffForm.username)) {
        alert("اسم المستخدم موجود مسبقاً");
        return;
      }
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        ...staffForm
      };
      setUsers([...users, newUser]);
      alert("تمت إضافة الموظف بنجاح");
    }
    setIsStaffModalOpen(false);
    setEditingStaff(null);
    setStaffForm({ name: '', username: '', role: UserRole.STAFF, password: '' });
  };

  const openEditStaff = (staff: User) => {
    setEditingStaff(staff);
    setStaffForm({
      name: staff.name,
      username: staff.username,
      role: staff.role,
      password: staff.password || ''
    });
    setIsStaffModalOpen(true);
  };

  const deleteStaff = (id: string) => {
    if (confirm("هل أنت متأكد من حذف هذا الموظف؟ سيؤدي ذلك لإخفاء سجلاته من بعض القوائم.")) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  // Domain & SubCategory Handlers
  const handleAddDomain = () => {
    if (newDomain.name && newDomain.price >= 0) {
      setDomains([...domains, { id: Date.now().toString(), name: newDomain.name, incentivePerPoint: newDomain.price }]);
      setNewDomain({ name: '', price: 0 });
    }
  };

  const handleUpdateDomain = () => {
    if (editingDomain && editingDomain.name && editingDomain.incentivePerPoint >= 0) {
      setDomains(domains.map(d => d.id === editingDomain.id ? editingDomain : d));
      setEditingDomain(null);
      alert("تم تحديث بيانات المجال");
    }
  };

  const handleAddSubCategory = () => {
    if (newSubCategory.domainId && newSubCategory.title) {
      const newSub: SubCategory = {
        id: Math.random().toString(36).substr(2, 9),
        domainId: newSubCategory.domainId,
        title: newSubCategory.title
      };
      setSubCategories([...subCategories, newSub]);
      setNewSubCategory({ ...newSubCategory, title: '' });
    } else {
      alert("يرجى اختيار المجال وإدخال عنوان الفرعي");
    }
  };

  const handleUpdateSubCategory = () => {
    if (editingSubCategory && editingSubCategory.title) {
      setSubCategories(subCategories.map(sc => sc.id === editingSubCategory.id ? editingSubCategory : sc));
      setEditingSubCategory(null);
      alert("تم تحديث العنوان الفرعي");
    }
  };

  const submitAssessment = () => {
    const staff = users.find(s => s.id === assessmentForm.staffId);
    const domain = domains.find(d => d.id === assessmentForm.domainId);
    const subCat = subCategories.find(s => s.id === assessmentForm.subCategoryId);

    if (!staff || !domain || !subCat) return alert("يرجى ملء جميع الحقول");

    const newEntry: Assessment = {
      id: Math.random().toString(36).substr(2, 9),
      staffId: staff.id,
      staffName: staff.name,
      domainId: domain.id,
      domainName: domain.name,
      subCategoryId: subCat.id,
      subCategoryTitle: subCat.title,
      points: Number(assessmentForm.points),
      totalIncentive: Number(assessmentForm.points) * domain.incentivePerPoint,
      date: new Date().toISOString()
    };

    setAssessments(prev => [newEntry, ...prev]);
    setAssessmentForm({ staffId: '', domainId: '', subCategoryId: '', points: 0 });
    alert("تم تسجيل التقييم بنجاح");
  };

  const generateReportInsight = async (staffId: string) => {
    if (!staffId) {
      setAiSummary('');
      return;
    }
    setLoadingSummary(true);
    try {
      const staff = users.find(s => s.id === staffId);
      const staffAssessments = assessments.filter(a => a.staffId === staffId);
      if (staff && staffAssessments.length > 0) {
        const summary = await getPerformanceSummary(staff.name, staffAssessments);
        setAiSummary(summary);
      } else {
        setAiSummary("لا توجد تقييمات مسجلة لهذا العضو حالياً لتحليلها.");
      }
    } catch (e) {
      setAiSummary("عذراً، حدث خطأ أثناء الاتصال بنظام الذكاء الاصطناعي.");
    } finally {
      setLoadingSummary(false);
    }
  };

  // وظيفة الطباعة المحسنة
  const handlePrint = () => {
    window.print();
  };

  // وظيفة التصدير إلى إكسل (CSV)
  const handleExportCSV = () => {
    if (assessments.length === 0) {
      alert("لا توجد بيانات لتصديرها.");
      return;
    }

    const headers = ["الاسم", "المجال", "العنوان الفرعي", "النقاط", "التحفيز (دج)", "التاريخ"];
    const rows = assessments.map(a => [
      a.staffName,
      a.domainName,
      a.subCategoryTitle,
      a.points,
      a.totalIncentive,
      new Date(a.date).toLocaleDateString('ar-DZ')
    ]);

    let csvContent = "\uFEFF"; // Unicode BOM for Arabic RTL support in Excel
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_التحفيزات_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    const totalIncentive = assessments.reduce((acc, curr) => acc + curr.totalIncentive, 0);
    const today = new Date().toISOString().split('T')[0];
    const dailyIncentive = assessments
      .filter(a => a.date.startsWith(today))
      .reduce((acc, curr) => acc + curr.totalIncentive, 0);
    
    return {
      total: totalIncentive,
      daily: dailyIncentive,
      count: assessments.length
    };
  }, [assessments]);

  const chartData = useMemo(() => {
    return domains.map(d => ({
      name: d.name,
      value: assessments.filter(a => a.domainId === d.id).reduce((acc, curr) => acc + curr.totalIncentive, 0)
    })).filter(d => d.value > 0);
  }, [assessments, domains]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md transition-all">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              {isRegisterMode ? <UserPlus className="text-blue-600" size={32} /> : <LogIn className="text-blue-600" size={32} />}
            </div>
            <h1 className="text-2xl font-bold text-gray-800">مركز الخطوات الواعدة</h1>
            <p className="text-gray-500">{isRegisterMode ? 'إنشاء حساب جديد' : 'نظام تسيير وتحفيز المربيات'}</p>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">الاسم الكامل</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="أدخل اسمك بالكامل"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">نوع الحساب</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200"
                    value={authForm.role}
                    onChange={(e) => setAuthForm({...authForm, role: e.target.value as UserRole})}
                  >
                    <option value={UserRole.STAFF}>مربية</option>
                    <option value={UserRole.TEACHER}>أستاذ / مختص</option>
                    <option value={UserRole.ADMIN}>مدير</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">اسم المستخدم</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="أدخل اسم المستخدم"
                value={authForm.username}
                onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">كلمة المرور</label>
              <input 
                type="password" 
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="••••••••"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">
              {isRegisterMode ? 'إنشاء الحساب' : 'تسجيل الدخول'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-blue-600 font-semibold text-sm hover:underline"
            >
              {isRegisterMode ? 'لديك حساب بالفعل؟ سجل دخولك' : 'ليس لديك حساب؟ سجل الآن'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-gray-200 p-6 flex flex-col hidden md:flex no-print">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <TrendingUp className="text-white" size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-800">إدارة التحفيز</h2>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="لوحة التحكم" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={ClipboardCheck} 
            label="تقييم الطاقم" 
            active={activeTab === 'assess'} 
            onClick={() => setActiveTab('assess')} 
          />
          {isAdmin && (
            <>
              <SidebarItem 
                icon={Users} 
                label="إدارة الطاقم" 
                active={activeTab === 'staff'} 
                onClick={() => setActiveTab('staff')} 
              />
              <SidebarItem 
                icon={BookOpen} 
                label="إدارة المجالات" 
                active={activeTab === 'domains'} 
                onClick={() => setActiveTab('domains')} 
              />
            </>
          )}
          <SidebarItem 
            icon={FileText} 
            label="التقارير المالية" 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')} 
          />
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 rounded-xl transition"
          >
            <LogOut size={20} />
            <span className="font-semibold">تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 no-print">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              أهلاً، {currentUser.name}
            </h1>
            <p className="text-gray-500">
              {isAdmin ? 'صلاحيات المدير' : (currentUser.role === UserRole.TEACHER ? 'صلاحيات أستاذ' : 'صلاحيات مربية')}
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-white p-2 rounded-full shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50">
               <Settings className="text-gray-400" size={20} />
             </div>
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
               {currentUser.name[0]}
             </div>
          </div>
        </header>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500 no-print">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard 
                title="إجمالي التحفيزات" 
                value={`${stats.total.toLocaleString()} د.ج`} 
                icon={DollarSign} 
                color="bg-emerald-500" 
              />
              <StatsCard 
                title="التحفيز اليومي" 
                value={`${stats.daily.toLocaleString()} د.ج`} 
                icon={TrendingUp} 
                color="bg-blue-500" 
              />
              <StatsCard 
                title="عدد التقييمات المسجلة" 
                value={stats.count.toString()} 
                icon={ClipboardCheck} 
                color="bg-amber-500" 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6">توزيع التحفيزات حسب المجال</h3>
                <div className="h-64">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-center p-4">
                      لا توجد بيانات كافية للرسم البياني حالياً. ابدأ بإضافة تقييمات!
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4">آخر التقييمات المسجلة</h3>
                <div className="space-y-4 overflow-y-auto max-h-64">
                  {assessments.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div>
                        <p className="font-semibold text-gray-800">{a.staffName}</p>
                        <p className="text-xs text-gray-500">{a.domainName} - {a.subCategoryTitle}</p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-blue-600">{a.totalIncentive} د.ج</p>
                        <p className="text-[10px] text-gray-400">{new Date(a.date).toLocaleDateString('ar-DZ')}</p>
                      </div>
                    </div>
                  ))}
                  {assessments.length === 0 && (
                    <p className="text-center text-gray-400 py-10">لا توجد تقييمات مسجلة حتى الآن.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Staff Management View */}
        {activeTab === 'staff' && isAdmin && (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-300 no-print">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">إدارة المربيات والأساتذة</h2>
              <button 
                onClick={() => {
                  setEditingStaff(null);
                  setStaffForm({ name: '', username: '', role: UserRole.STAFF, password: '' });
                  setIsStaffModalOpen(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-blue-100 hover:bg-blue-700"
              >
                <Plus size={18} /> إضافة عضو طاقم
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map(u => (
                <div key={u.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">
                      {u.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{u.name}</h4>
                      <p className="text-sm text-gray-400">@{u.username}</p>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                        u.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-600' : 
                        (u.role === UserRole.TEACHER ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600')
                      }`}>
                        {u.role === UserRole.ADMIN ? 'مدير' : (u.role === UserRole.TEACHER ? 'أستاذ' : 'مربية')}
                      </span>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                    <button onClick={() => openEditStaff(u)} className="p-2 text-gray-400 hover:text-blue-500">
                      <Edit2 size={16} />
                    </button>
                    {u.id !== currentUser.id && (
                      <button onClick={() => deleteStaff(u.id)} className="p-2 text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal for Add/Edit Staff */}
            {isStaffModalOpen && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">{editingStaff ? 'تعديل بيانات العضو' : 'إضافة عضو طاقم جديد'}</h3>
                    <button onClick={() => setIsStaffModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">الاسم الكامل</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="الاسم"
                        value={staffForm.name}
                        onChange={e => setStaffForm({...staffForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">اسم المستخدم</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="username"
                        value={staffForm.username}
                        onChange={e => setStaffForm({...staffForm, username: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">نوع الدور</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200"
                        value={staffForm.role}
                        onChange={e => setStaffForm({...staffForm, role: e.target.value as UserRole})}
                      >
                        <option value={UserRole.STAFF}>مربية</option>
                        <option value={UserRole.TEACHER}>أستاذ / مختص</option>
                        <option value={UserRole.ADMIN}>مدير</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">كلمة المرور</label>
                      <input 
                        type="password"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                        placeholder="أدخل كلمة مرور جديدة"
                        value={staffForm.password}
                        onChange={e => setStaffForm({...staffForm, password: e.target.value})}
                      />
                    </div>
                    <button 
                      onClick={handleSaveStaff}
                      className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
                    >
                      حفظ البيانات
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assessment View */}
        {activeTab === 'assess' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100 animate-in slide-in-from-bottom-4 duration-300 no-print">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ClipboardCheck className="text-blue-600" />
              تسجيل تقييم جديد
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">المربية / الأستاذ</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
                  value={assessmentForm.staffId}
                  onChange={(e) => setAssessmentForm({...assessmentForm, staffId: e.target.value})}
                >
                  <option value="">اختر الاسم...</option>
                  {users.filter(s => s.role !== UserRole.ADMIN).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role === UserRole.TEACHER ? 'أستاذ' : 'مربية'})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">المجال</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
                    value={assessmentForm.domainId}
                    onChange={(e) => setAssessmentForm({...assessmentForm, domainId: e.target.value})}
                  >
                    <option value="">اختر المجال...</option>
                    {domains.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.incentivePerPoint} د.ج)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">العنوان الفرعي</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500"
                    value={assessmentForm.subCategoryId}
                    onChange={(e) => setAssessmentForm({...assessmentForm, subCategoryId: e.target.value})}
                    disabled={!assessmentForm.domainId}
                  >
                    <option value="">اختر العنوان...</option>
                    {subCategories
                      .filter(sc => sc.domainId === assessmentForm.domainId)
                      .map(sc => (
                        <option key={sc.id} value={sc.id}>{sc.title}</option>
                      ))
                    }
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">عدد النقاط / التكرارات</label>
                <input 
                  type="number" 
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500" 
                  placeholder="0"
                  value={assessmentForm.points}
                  onChange={(e) => setAssessmentForm({...assessmentForm, points: Number(e.target.value)})}
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center transition-all">
                <span className="font-semibold text-blue-800">إجمالي التحفيز المستحق:</span>
                <span className="text-xl font-bold text-blue-600">
                  {assessmentForm.domainId && assessmentForm.points 
                    ? (domains.find(d => d.id === assessmentForm.domainId)!.incentivePerPoint * assessmentForm.points).toLocaleString() 
                    : 0} د.ج
                </span>
              </div>

              <button 
                onClick={submitAssessment}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition active:scale-95"
              >
                تأكيد وتسجيل التقييم
              </button>
            </div>
          </div>
        )}

        {/* Domain & SubCategory Management View (Admin only) */}
        {activeTab === 'domains' && isAdmin && (
          <div className="space-y-8 animate-in fade-in duration-500 no-print">
            {/* Section 1: Domains */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <BookOpen className="text-blue-600" size={24} />
                إدارة مجالات العمل
              </h2>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <input 
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="اسم المجال (مثال: السلوك التكيفي)"
                  value={newDomain.name}
                  onChange={(e) => setNewDomain({...newDomain, name: e.target.value})}
                />
                <input 
                  type="number" 
                  min="0"
                  className="w-32 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="السعر (د.ج)"
                  value={newDomain.price}
                  onChange={(e) => setNewDomain({...newDomain, price: Number(e.target.value)})}
                />
                <button 
                  onClick={handleAddDomain}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition"
                >
                  <Plus size={18} /> إضافة مجال
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {domains.map(d => (
                  <div key={d.id} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col justify-between group hover:border-blue-200 transition relative">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-lg text-gray-800">{d.name}</h4>
                        <p className="text-blue-600 font-semibold">{d.incentivePerPoint} د.ج / لكل نقطة</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingDomain(d)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm("سيؤدي حذف المجال إلى تعذر تسجيل تقييمات جديدة له. هل تريد الاستمرار؟")) {
                              setDomains(domains.filter(item => item.id !== d.id));
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: SubCategories */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Layers className="text-blue-600" size={24} />
                إدارة العناوين الفرعية
              </h2>
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <select 
                  className="w-full md:w-64 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSubCategory.domainId}
                  onChange={(e) => setNewSubCategory({...newSubCategory, domainId: e.target.value})}
                >
                  <option value="">اختر المجال...</option>
                  {domains.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <input 
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="عنوان فرعي جديد (مثال: مهارات الأكل)"
                  value={newSubCategory.title}
                  onChange={(e) => setNewSubCategory({...newSubCategory, title: e.target.value})}
                />
                <button 
                  onClick={handleAddSubCategory}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition"
                >
                  <Plus size={18} /> إضافة عنوان
                </button>
              </div>

              {/* Grouped SubCategories List */}
              <div className="space-y-6">
                {domains.map(d => {
                  const subs = subCategories.filter(sc => sc.domainId === d.id);
                  return (
                    <div key={d.id} className="border border-gray-50 rounded-2xl p-4 bg-gray-50/50">
                      <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        {d.name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {subs.map(s => (
                          <div key={s.id} className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-3 shadow-sm hover:border-indigo-200 transition group/sub">
                            <span className="text-sm text-gray-600">{s.title}</span>
                            <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setEditingSubCategory(s)}
                                className="text-gray-400 hover:text-blue-500"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button 
                                onClick={() => setSubCategories(subCategories.filter(sub => sub.id !== s.id))}
                                className="text-gray-300 hover:text-red-500"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {subs.length === 0 && <span className="text-xs text-gray-400 italic">لا توجد عناوين فرعية لهذا المجال</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Edit Domain Modal */}
            {editingDomain && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">تعديل بيانات المجال</h3>
                    <button onClick={() => setEditingDomain(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">اسم المجال</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={editingDomain.name}
                        onChange={e => setEditingDomain({...editingDomain, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-1">سعر النقطة (د.ج)</label>
                      <input 
                        type="number"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={editingDomain.incentivePerPoint}
                        onChange={e => setEditingDomain({...editingDomain, incentivePerPoint: Number(e.target.value)})}
                      />
                    </div>
                    <button 
                      onClick={handleUpdateDomain}
                      className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> حفظ التغييرات
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit SubCategory Modal */}
            {editingSubCategory && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">تعديل العنوان الفرعي</h3>
                    <button onClick={() => setEditingSubCategory(null)} className="text-gray-400 hover:text-gray-600">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-1">العنوان</label>
                      <input 
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={editingSubCategory.title}
                        onChange={e => setEditingSubCategory({...editingSubCategory, title: e.target.value})}
                      />
                    </div>
                    <button 
                      onClick={handleUpdateSubCategory}
                      className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                    >
                      <Save size={18} /> حفظ التغييرات
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Reports View */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 no-print">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <h2 className="text-xl font-bold">التقارير المالية والأداء</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={handlePrint} 
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 flex items-center gap-2 transition shadow-md"
                  >
                    <Printer size={18} />
                    طباعة التقرير
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center gap-2 transition shadow-md"
                  >
                    <Download size={18} />
                    تصدير ملف Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Performance Summary Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4 no-print">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp size={20} />
                    تحليل الأداء الذكي (AI)
                  </h3>
                  <select 
                    className="bg-white/20 border-none rounded-lg text-sm px-3 py-1 outline-none cursor-pointer focus:bg-white/30 transition"
                    onChange={(e) => generateReportInsight(e.target.value)}
                  >
                    <option value="" className="text-black">اختر العضو للتحليل...</option>
                    {users.filter(s => s.role !== UserRole.ADMIN).map(s => (
                      <option key={s.id} value={s.id} className="text-black">{s.name} ({s.role === UserRole.TEACHER ? 'أستاذ' : 'مربية'})</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  {loadingSummary && (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  )}
                  <p className="text-blue-50 leading-relaxed italic min-h-[3rem]">
                    {loadingSummary ? 'جاري استخلاص النتائج وتحليل السجلات بواسطة Gemini...' : (aiSummary || 'اختر مربية أو أستاذ لعرض ملخص أداء احترافي مدعوم بالذكاء الاصطناعي.')}
                  </p>
                </div>
              </div>
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 bg-white/5 rounded-full blur-3xl no-print"></div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-bold text-gray-700">الاسم</th>
                      <th className="px-6 py-4 font-bold text-gray-700">المجال / العنوان</th>
                      <th className="px-6 py-4 font-bold text-gray-700 text-center">النقاط</th>
                      <th className="px-6 py-4 font-bold text-gray-700">المبلغ الإجمالي</th>
                      <th className="px-6 py-4 font-bold text-gray-700">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {assessments.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-800">{a.staffName}</td>
                        <td className="px-6 py-4 text-gray-600">
                          <span className="block font-medium">{a.domainName}</span>
                          <span className="text-xs text-gray-400">{a.subCategoryTitle}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">{a.points}</span>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600">{a.totalIncentive.toLocaleString()} د.ج</td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(a.date).toLocaleDateString('ar-DZ')}
                        </td>
                      </tr>
                    ))}
                    {assessments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-gray-400">لا توجد سجلات تقارير لعرضها حالياً.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 z-50 shadow-2xl no-print">
        <button onClick={() => setActiveTab('dashboard')} className={`p-2 rounded-lg transition ${activeTab === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
          <LayoutDashboard size={24} />
        </button>
        <button onClick={() => setActiveTab('assess')} className={`p-2 rounded-lg transition ${activeTab === 'assess' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
          <ClipboardCheck size={24} />
        </button>
        {isAdmin && (
          <button onClick={() => setActiveTab('staff')} className={`p-2 rounded-lg transition ${activeTab === 'staff' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
            <Users size={24} />
          </button>
        )}
        <button onClick={() => setActiveTab('domains')} className={`p-2 rounded-lg transition ${activeTab === 'domains' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
          <BookOpen size={24} />
        </button>
        <button onClick={() => setActiveTab('reports')} className={`p-2 rounded-lg transition ${activeTab === 'reports' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
          <FileText size={24} />
        </button>
        <button onClick={handleLogout} className="p-2 text-red-400">
          <LogOut size={24} />
        </button>
      </nav>
    </div>
  );
}
