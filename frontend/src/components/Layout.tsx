import { NavLink, Outlet } from 'react-router-dom';
import { useCurrentCustomer } from '../context/CustomerContext';

const NAV = [
  { to: '/policies', label: 'นโยบายการลงทุน' },
  { to: '/portfolios', label: 'พอร์ตของฉัน' },
  { to: '/orders', label: 'คำสั่งซื้อ' },
];

export function Layout() {
  const { customers, customer, setCustomerId, isLoading, error } = useCurrentCustomer();

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <span className="brand">
            <span className="brand__mark" aria-hidden="true" />
            Fund Dashboard
          </span>
          <nav className="nav" aria-label="เมนูหลัก">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav__link${isActive ? ' is-active' : ''}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <label className="customer-picker">
            <span className="customer-picker__label">ลูกค้า</span>
            <select
              value={customer?.id ?? ''}
              onChange={(e) => setCustomerId(e.target.value)}
              disabled={isLoading || Boolean(error) || customers.length === 0}
            >
              {isLoading && <option value="">กำลังโหลด…</option>}
              {error && <option value="">โหลดรายชื่อลูกค้าไม่สำเร็จ</option>}
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
