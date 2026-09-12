import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { NewOrderPage } from './pages/NewOrderPage'
import { InventoryPage } from './pages/InventoryPage'
import { StatisticsPage } from './pages/StatisticsPage'
import { ConfigLayout } from './pages/config/ConfigLayout'
import { AdminProfilePage } from './pages/config/AdminProfilePage'
import { UsuariosPage } from './pages/config/UsuariosPage'
import { UserFormPage } from './pages/config/UserFormPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<NewOrderPage />} />
          <Route path="/inventario" element={<InventoryPage />} />
          <Route path="/estadisticas" element={<StatisticsPage />} />
          <Route path="/configuracion" element={<ConfigLayout />}>
            <Route index element={<Navigate to="perfil" replace />} />
            <Route path="perfil" element={<AdminProfilePage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="usuarios/nuevo" element={<UserFormPage />} />
            <Route path="usuarios/:id" element={<UserFormPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
