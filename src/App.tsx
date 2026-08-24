import { useState } from "react"
import BottomNav from "./components/BottomNav"
import LoginScreen from "./screens/LoginScreen"
import HomeScreen from "./screens/HomeScreen"
import FarmersScreen from "./screens/FarmersScreen"
import FarmerProfileScreen from "./screens/FarmerProfileScreen"
import NewFarmerScreen from "./screens/NewFarmerScreen"
import GpsMapScreen from "./screens/GpsMapScreen"
import SyncScreen from "./screens/SyncScreen"
import TasksScreen from "./screens/TasksScreen"
import MoreScreen from "./screens/MoreScreen"
import SubmitSuccessScreen from "./screens/SubmitSuccessScreen"

type Tab = "home" | "farmers" | "tasks" | "more"

type Screen =
  | { id: "login" }
  | { id: "main"; tab: Tab }
  | { id: "farmer-profile"; farmerId: string }
  | { id: "new-farmer" }
  | { id: "gps-map" }
  | { id: "sync" }
  | { id: "submit-success" }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ id: "login" })
  const [tab, setTab] = useState<Tab>("home")
  const [isOffline, setIsOffline] = useState(false)

  const navigate = (s: Screen) => setScreen(s)
  const goMain = (t?: Tab) => {
    if (t) setTab(t)
    setScreen({ id: "main", tab: t || tab })
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Phone shell */}
      <div
        className="relative flex flex-col overflow-hidden bg-surface"
        style={{ width: 390, height: 844, borderRadius: 44, boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)" }}
      >
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-charcoal rounded-b-2xl z-50" />

        {screen.id === "login" && (
          <LoginScreen onLogin={() => goMain("home")} />
        )}

        {screen.id === "main" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden flex flex-col">
              {tab === "home" && (
                <HomeScreen
                  isOffline={isOffline}
                  onNavigateSync={() => navigate({ id: "sync" })}
                  onCollect={() => navigate({ id: "new-farmer" })}
                />
              )}
              {tab === "farmers" && (
                <FarmersScreen
                  onSelectFarmer={id => navigate({ id: "farmer-profile", farmerId: id })}
                />
              )}
              {tab === "tasks" && <TasksScreen />}
              {tab === "more" && (
                <MoreScreen
                  onSync={() => navigate({ id: "sync" })}
                  isOffline={isOffline}
                  onToggleOffline={() => setIsOffline(o => !o)}
                />
              )}
            </div>
            <BottomNav
              activeTab={tab}
              onTabChange={t => { setTab(t); setScreen({ id: "main", tab: t }) }}
              onCollect={() => navigate({ id: "new-farmer" })}
            />
          </div>
        )}

        {screen.id === "farmer-profile" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <FarmerProfileScreen
              farmerId={screen.farmerId}
              onBack={() => goMain("farmers")}
              onCollect={() => navigate({ id: "new-farmer" })}
            />
            <BottomNav
              activeTab={tab}
              onTabChange={t => { setTab(t); setScreen({ id: "main", tab: t }) }}
              onCollect={() => navigate({ id: "new-farmer" })}
            />
          </div>
        )}

        {screen.id === "new-farmer" && (
          <NewFarmerScreen
            onBack={() => goMain()}
            onGpsMap={() => navigate({ id: "gps-map" })}
            onComplete={() => navigate({ id: "submit-success" })}
          />
        )}

        {screen.id === "gps-map" && (
          <GpsMapScreen
            onBack={() => navigate({ id: "new-farmer" })}
            onSave={() => navigate({ id: "new-farmer" })}
          />
        )}

        {screen.id === "sync" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <SyncScreen
              onBack={() => goMain()}
              isOffline={isOffline}
            />
            <BottomNav
              activeTab={tab}
              onTabChange={t => { setTab(t); setScreen({ id: "main", tab: t }) }}
              onCollect={() => navigate({ id: "new-farmer" })}
            />
          </div>
        )}

        {screen.id === "submit-success" && (
          <SubmitSuccessScreen onDone={() => goMain("farmers")} />
        )}
      </div>
    </div>
  )
}
