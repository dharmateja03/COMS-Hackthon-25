import React from 'react';
import { DashboardHeader } from '../components/DashboardHeader';
import { CourseCard } from '../components/CourseCard';
const mockCourses = [{
  id: 1,
  title: 'Introduction to Machine Learning',
  description: 'Learn the fundamentals of machine learning, including supervised and unsupervised learning techniques, neural networks, and practical applications.',
  dateCreated: 'Jan 15, 2024'
}, {
  id: 2,
  title: 'Advanced React Patterns',
  description: 'Master advanced React concepts including custom hooks, context API, performance optimization, and modern state management patterns.',
  dateCreated: 'Jan 10, 2024'
}, {
  id: 3,
  title: 'Data Structures & Algorithms',
  description: 'Comprehensive guide to essential data structures and algorithms with real-world problem-solving techniques and coding challenges.',
  dateCreated: 'Jan 5, 2024'
}, {
  id: 4,
  title: 'Web Design Fundamentals',
  description: 'Explore the principles of modern web design, including typography, color theory, layout composition, and user experience best practices.',
  dateCreated: 'Dec 28, 2023'
}, {
  id: 5,
  title: 'Python for Data Science',
  description: 'Dive into data analysis and visualization using Python, pandas, NumPy, and matplotlib for real-world data science projects.',
  dateCreated: 'Dec 20, 2023'
}, {
  id: 6,
  title: 'Cloud Computing Essentials',
  description: 'Understanding cloud infrastructure, deployment strategies, serverless architecture, and best practices for scalable applications.',
  dateCreated: 'Dec 15, 2023'
}];
export function Dashboard() {
  return <div className="min-h-screen bg-dark-bg">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-4xl font-bold gradient-text mb-8">My Courses</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockCourses.map(course => <CourseCard key={course.id} title={course.title} description={course.description} dateCreated={course.dateCreated} />)}
        </div>
      </main>
    </div>;
}