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
  | { id: "gps-map"; farmId: string }
  | { id: "sync" }
  | { id: "submit-success" }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ id: "login" })
  const [tab, setTab] = useState<Tab>("home")
  const [isOffline, setIsOffline] = useState(false)

  const goMain = (nextTab?: Tab) => {
    if (nextTab) setTab(nextTab)
    setScreen({ id: "main", tab: nextTab || tab })
  }

  const showNav = screen.id === "main" || screen.id === "farmer-profile" || screen.id === "sync"

  return (
    <div className="h-full bg-[#E2E4E3] flex justify-center">
      <div
        role="application"
        aria-label="MkulimaCollect"
        className="relative w-full max-w-[430px] h-full bg-surface flex flex-col overflow-hidden border-x border-charcoal-100"
      >
        {screen.id === "login" && (
          <LoginScreen onLogin={() => goMain("home")} />
        )}

        {screen.id === "main" && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {tab === "home" && (
              <HomeScreen
                isOffline={isOffline}
                onNavigateSync={() => setScreen({ id: "sync" })}
                onCollect={() => setScreen({ id: "new-farmer" })}
              />
            )}
            {tab === "farmers" && (
              <FarmersScreen
                onSelectFarmer={id => setScreen({ id: "farmer-profile", farmerId: id })}
              />
            )}
            {tab === "tasks" && <TasksScreen />}
            {tab === "more" && (
              <MoreScreen
                onSync={() => setScreen({ id: "sync" })}
                isOffline={isOffline}
                onToggleOffline={() => setIsOffline(value => !value)}
                onSignOut={() => setScreen({ id: "login" })}
              />
            )}
          </div>
        )}

        {screen.id === "farmer-profile" && (
          <FarmerProfileScreen
            farmerId={screen.farmerId}
            onBack={() => goMain("farmers")}
            onCollect={() => setScreen({ id: "new-farmer" })}
          />
        )}

        {screen.id === "new-farmer" && (
          <NewFarmerScreen
            onBack={() => goMain()}
            onGpsMap={farmId => setScreen({ id: "gps-map", farmId })}
            onComplete={() => setScreen({ id: "submit-success" })}
          />
        )}

        {screen.id === "gps-map" && (
          <GpsMapScreen
            farmId={screen.farmId}
            onBack={() => setScreen({ id: "new-farmer" })}
            onSave={() => setScreen({ id: "new-farmer" })}
          />
        )}

        {screen.id === "sync" && (
          <SyncScreen
            onBack={() => goMain()}
            isOffline={isOffline}
          />
        )}

        {screen.id === "submit-success" && (
          <SubmitSuccessScreen onDone={() => goMain("farmers")} />
        )}

        {showNav && (
          <BottomNav
            activeTab={tab}
            onTabChange={next => goMain(next)}
            onCollect={() => setScreen({ id: "new-farmer" })}
          />
        )}
      </div>
    </div>
  )
}
