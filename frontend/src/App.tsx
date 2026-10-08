import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { ProblemList } from './pages/ProblemList';
import { ProblemDetail } from './pages/ProblemDetail';
import { ProblemEditor } from './pages/ProblemEditor';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { SubmissionsPage } from './pages/SubmissionsPage';
import { usePyodide } from './hooks/usePyodide';
import { Code2, Heart } from 'lucide-react';

const MainApp: React.FC = () => {
  const { isTeacher } = useAuth();
  const { isReady: isPyodideReady } = usePyodide();

  const [currentTab, setCurrentTab] = useState<string>('problems');
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  const [editProblemId, setEditProblemId] = useState<number | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSelectProblem = (id: number) => {
    setSelectedProblemId(id);
    setCurrentTab('detail');
  };

  const handleEditProblem = (id: number) => {
    setEditProblemId(id);
    setCurrentTab('edit-problem');
  };

  const handleCreateNew = () => {
    setEditProblemId(null);
    setCurrentTab('create-problem');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        openAuthModal={() => setIsAuthModalOpen(true)}
        isPyodideReady={isPyodideReady}
      />

      <main className="flex-1">
        {currentTab === 'problems' && (
          <ProblemList
            onSelectProblem={handleSelectProblem}
            onEditProblem={handleEditProblem}
            onCreateNew={handleCreateNew}
          />
        )}

        {currentTab === 'detail' && selectedProblemId && (
          <ProblemDetail
            problemId={selectedProblemId}
            onBack={() => setCurrentTab('problems')}
            openAuthModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {(currentTab === 'create-problem' || currentTab === 'edit-problem') && (
          <ProblemEditor
            editProblemId={currentTab === 'edit-problem' ? editProblemId : null}
            onBack={() => setCurrentTab('problems')}
            onSaved={() => {
              setCurrentTab('problems');
              setEditProblemId(null);
            }}
          />
        )}

        {currentTab === 'teacher-dashboard' && isTeacher && (
          <TeacherDashboard />
        )}

        {currentTab === 'submissions' && (
          <SubmissionsPage
            onSelectProblem={(id) => {
              setSelectedProblemId(id);
              setCurrentTab('detail');
            }}
          />
        )}
      </main>

      {/* Footer (only show when not in IDE mode) */}
      {currentTab !== 'detail' && (
        <footer className="bg-slate-900/60 border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold text-slate-400">MindX CodeLab</span>
              <span>- Nền tảng học lập trình Python trực tuyến</span>
            </div>
            <div className="flex items-center gap-1 text-slate-500">
              <span>Được xây dựng với</span>
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>dành cho học viên và giáo viên MindX</span>
            </div>
          </div>
        </footer>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
