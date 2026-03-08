import { Link } from 'react-router-dom';
import { Star, Clock, Users, Play, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Course, getInstructor, getCategory } from '@/data/mockData';

interface CourseCardProps {
  course: Course;
  variant?: 'default' | 'compact' | 'horizontal';
}

const levelColors: Record<string, string> = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  advanced: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

export default function CourseCard({ course, variant = 'default' }: CourseCardProps) {
  const instructor = getInstructor(course.instructorId);
  const category = getCategory(course.categoryId);

  const formatDuration = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours}h`;
  };

  const formatStudents = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
    return count.toString();
  };

  if (variant === 'compact') {
    return (
      <Link to={`/courses/${course.id}`} className="flex gap-3 group p-3 rounded-lg hover:bg-secondary/50 transition-colors">
        <div className="w-20 h-14 rounded-md overflow-hidden shrink-0">
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">{course.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gold font-semibold">{course.rating}</span>
            <Star className="w-3 h-3 fill-gold text-gold" />
          </div>
          <p className="text-sm font-semibold text-primary mt-0.5">${course.price}</p>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/courses/${course.id}`} className="group block">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-all duration-300 hover:shadow-glow h-full flex flex-col">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-navy-deep/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-glow">
              <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
            </div>
          </div>
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {course.originalPrice && (
              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-accent text-accent-foreground">
                {Math.round((1 - course.price / course.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>
          <div className="absolute top-3 right-3">
            <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${levelColors[course.level]}`}>
              {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          {/* Category */}
          {category && (
            <span className="text-xs text-primary font-medium mb-2">{category.icon} {category.name}</span>
          )}

          {/* Title */}
          <h3 className="font-display font-semibold text-foreground line-clamp-2 leading-snug mb-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          {/* Instructor */}
          {instructor && (
            <div className="flex items-center gap-2 mb-3">
              <img src={instructor.avatar} alt={instructor.name} className="w-5 h-5 rounded-full" />
              <span className="text-xs text-muted-foreground">{instructor.name}</span>
            </div>
          )}

          {/* Rating & Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <span className="text-gold font-bold">{course.rating}</span>
              <Star className="w-3 h-3 fill-gold text-gold" />
              <span>({course.ratingCount})</span>
            </div>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{formatStudents(course.studentsCount)}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(course.duration)}</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lessonsCount}</span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {course.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-2 py-0.5 text-xs rounded-md bg-secondary text-muted-foreground">{tag}</span>
            ))}
          </div>

          {/* Price */}
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-display font-bold text-foreground">${course.price}</span>
              {course.originalPrice && (
                <span className="text-sm text-muted-foreground line-through">${course.originalPrice}</span>
              )}
            </div>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">
              {course.language}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
