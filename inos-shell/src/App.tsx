import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppSpine from "./layout/AppSpine";
import { TwinProfileIntake } from "./components/TwinProfileIntake";
import DriveCanonApp from "./pages/apps/DriveCanonApp";
import EchoSignIn from "./pages/apps/EchoSignIn";
import GgpIntranetApp from "./pages/apps/GgpIntranetApp";
import IeIntranetApp from "./pages/apps/IeIntranetApp";
import FfcIntranetApp from "./pages/apps/FfcIntranetApp";
import CngiIntranetApp from "./pages/apps/CngiIntranetApp";
import FrontDoor from "./pages/FrontDoor";
import TwinProfileSprints from "./pages/TwinProfileSprints";
import Home from "./pages/Home";
import RoomMe from "./pages/RoomMe";
import Foundation from "./pages/Foundation";
import Core from "./pages/Core";
import Agents from "./pages/Agents";
import TeamAIHQ from "./pages/TeamAIHQ";
import Guilds from "./pages/Guilds";
import Apps from "./pages/Apps";
import IeHqSpine from "./pages/IeHqSpine";
import OwnerGate from "./components/OwnerGate";
import TimelineViewer from "./pages/TimelineViewer";
import DatabaseSync from "./pages/DatabaseSync";
import Logs from "./pages/Logs";
import Inbox from "./pages/Inbox";
import Tasks from "./pages/Tasks";
import OperationsLayout from "./pages/operations/OperationsLayout";
import WarRoom from "./pages/operations/WarRoom";
import CoreConsole from "./pages/operations/CoreConsole";
import AimRouter from "./pages/operations/AimRouter";
import Constraints from "./pages/operations/Constraints";
import Evidence from "./pages/operations/Evidence";
import UnschoolLayout from "./unschool/UnschoolLayout";
import OperatorDashboard from "./unschool/pages/OperatorDashboard";
import Students from "./unschool/pages/Students";
import Skills from "./unschool/pages/Skills";
import Sessions from "./unschool/pages/Sessions";
import SessionRunner from "./unschool/pages/SessionRunner";
import BaselineV2 from "./unschool/pages/BaselineV2";
import WeeklyReviewV2 from "./unschool/pages/WeeklyReviewV2";
import TeacherConsole from "./unschool/pages/TeacherConsole";
import SettingsV2 from "./unschool/pages/SettingsV2";
import ReviewAccessGate from "./components/ReviewAccessGate";
import SystemProvisioning from "./pages/SystemProvisioning";
import TimeWallet from "./pages/TimeWallet";
import { AuthProvider } from "./auth/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppSpine />}>
            <Route index element={<Navigate to="/front-door" replace />} />
            <Route path="front-door" element={<FrontDoor />} />
            <Route path="home" element={<Home />} />
            <Route path="room/me" element={<RoomMe />} />
            <Route path="foundation" element={<Foundation />} />
            <Route path="core" element={<Core />} />
            <Route path="agents" element={<Agents />} />
            <Route path="team-ai-hq" element={<TeamAIHQ />} />
            <Route path="guilds" element={<Guilds />} />
            <Route path="apps" element={<Apps />} />
            <Route
              path="apps/ie-hq-spine"
              element={
                <OwnerGate>
                  <IeHqSpine />
                </OwnerGate>
              }
            />
            <Route path="apps/twin-profile" element={<TwinProfileIntake />} />      
            <Route path="apps/twin-profile/sprints" element={<TwinProfileSprints />} />
          <Route path="provisioning" element={<SystemProvisioning />} />
            <Route path="apps/timeline-viewer" element={<TimelineViewer />} />      
            <Route path="apps/db-sync" element={<DatabaseSync />} />
            <Route path="apps/drive" element={<DriveCanonApp />} />
            <Route path="apps/echo-signin" element={<EchoSignIn />} />
            <Route
              path="apps/ggp-intranet"
              element={
                <ReviewAccessGate entity="GGP">
                  <GgpIntranetApp />
                </ReviewAccessGate>
              }
            />
            <Route
              path="apps/ie-intranet"
              element={
                <ReviewAccessGate entity="IE">
                  <IeIntranetApp />
                </ReviewAccessGate>
              }
            />
            <Route
              path="apps/ffc-intranet"
              element={
                <ReviewAccessGate entity="FFC">
                  <FfcIntranetApp />
                </ReviewAccessGate>
              }
            />
            <Route
              path="apps/cngi-intranet"
              element={
                <ReviewAccessGate entity="CNGI">
                  <CngiIntranetApp />
                </ReviewAccessGate>
              }
            />
            <Route path="operations" element={<OperationsLayout />}>
              <Route index element={<WarRoom />} />
              <Route path="war" element={<WarRoom />} />
              <Route path="core" element={<CoreConsole />} />
              <Route path="aim" element={<AimRouter />} />
              <Route path="constraints" element={<Constraints />} />
              <Route path="evidence" element={<Evidence />} />
            </Route>
            <Route path="time-wallet" element={<TimeWallet />} />
            <Route path="logs" element={<Logs />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="unschool" element={<UnschoolLayout />}>
              <Route index element={<OperatorDashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="skills" element={<Skills />} />
              <Route path="sessions" element={<Sessions />} />
              <Route path="session/new" element={<SessionRunner />} />
              <Route path="baseline" element={<BaselineV2 />} />
              <Route path="weekly" element={<WeeklyReviewV2 />} />
              <Route path="teacher" element={<TeacherConsole />} />
              <Route path="settings" element={<SettingsV2 />} />
            </Route>
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


