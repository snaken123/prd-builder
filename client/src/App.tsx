import "./App.css";
import { CustomerForm } from "./CustomerForm";
import { AdminApp } from "./AdminApp";

function App() {
  const isAdmin = window.location.pathname.startsWith("/admin");
  return isAdmin ? <AdminApp /> : <CustomerForm />;
}

export default App;
