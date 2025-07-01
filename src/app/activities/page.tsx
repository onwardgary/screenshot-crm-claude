import ActivityList from '@/components/ActivityList'
import Navbar from '@/components/Navbar'

export default function ActivitiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar currentPage="activities" />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Unorganized Activities</h1>
          <p className="text-slate-600">
            Activities from screenshots that haven't been organized into contacts yet
          </p>
        </div>
        
        <ActivityList organized={false} />
      </div>
    </div>
  )
}