import { BarChart3 } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">DataViz Pro</h1>
              <p className="text-sm text-blue-100">Professional Data Analytics Dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
