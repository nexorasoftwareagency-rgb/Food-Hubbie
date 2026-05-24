import { Star } from "lucide-react";

const StarRating = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star key={i} size={11} fill={i <= Math.round(rating) ? "#f59e0b" : "none"} stroke={i <= Math.round(rating) ? "#f59e0b" : "#cbd5e1"} />
    ))}
    <span className="text-xs text-slate-500 ml-1">{rating}</span>
  </div>
);

export default StarRating;
