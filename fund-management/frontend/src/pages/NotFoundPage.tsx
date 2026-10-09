import { Link } from 'react-router-dom';
import { EmptyState } from '../components/Feedback';

export function NotFoundPage() {
  return (
    <EmptyState>
      <h1>404</h1>
      <p>ไม่พบหน้าที่ต้องการ</p>
      <Link to="/policies" className="btn btn--ghost">
        กลับหน้าแรก
      </Link>
    </EmptyState>
  );
}
