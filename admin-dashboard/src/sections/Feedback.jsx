import GlassCard from "../components/GlassCard";
import Avatar from "../components/Avatar";
import StarRating from "../components/StarRating";
import { ORANGE } from "../utils/constants";

const MOCK_FEEDBACK = [
  { id:1, customer:"Rahul S.", rating:5, comment:"Amazing food and super fast delivery! The butter chicken was exceptional.", dish:"Butter Chicken", time:"1 hr ago" },
  { id:2, customer:"Priya S.", rating:4, comment:"Really good paneer tikka. Could be a bit more spicy but overall great.", dish:"Paneer Tikka", time:"3 hrs ago" },
  { id:3, customer:"Amit K.", rating:5, comment:"Best biryani in Ranchi! Will definitely order again.", dish:"Biryani", time:"5 hrs ago" },
  { id:4, customer:"Neha G.", rating:3, comment:"Food was good but delivery took longer than expected.", dish:"Dal Makhani", time:"Yesterday" },
  { id:5, customer:"Deepak J.", rating:5, comment:"Excellent quality and packaging. Rider was very polite.", dish:"Tandoori Chicken", time:"2 days ago" },
];

const Feedback = () => (
  <div className="space-y-4">
    <GlassCard className="p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="text-center">
          <div className="text-5xl font-black text-slate-800" style={{ fontFamily:"'Outfit', sans-serif" }}>4.7</div>
          <StarRating rating={4.7} />
          <div className="text-xs text-slate-500 mt-1">148 reviews</div>
        </div>
        <div className="flex-1 space-y-2 w-full">
          {[5,4,3,2,1].map((n,i) => {
            const pcts = [70,18,8,2,2];
            return (
              <div key={n} className="flex items-center gap-2">
                <span className="text-xs text-slate-500 w-4">{n}\u2605</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width:`${pcts[i]}%`, backgroundColor:"#f59e0b" }} />
                </div>
                <span className="text-xs text-slate-400 w-8">{pcts[i]}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </GlassCard>
    <div className="space-y-3">
      {MOCK_FEEDBACK.map(f => (
        <GlassCard key={f.id} className="p-4">
          <div className="flex items-start gap-3">
            <Avatar name={f.customer} size={36} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800">{f.customer}</span>
                <span className="text-xs text-slate-400">{f.time}</span>
              </div>
              <StarRating rating={f.rating} />
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{f.comment}</p>
              <span className="text-xs mt-2 inline-block px-2 py-0.5 rounded-full" style={{ backgroundColor:"#fff7ed", color:ORANGE }}>re: {f.dish}</span>
            </div>
          </div>
        </GlassCard>
      ))}
    </div>
  </div>
);

export default Feedback;
