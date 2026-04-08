import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, User, ArrowRight, Heart, ShoppingCart, Clock, FileText, Sparkles, Package, GraduationCap } from 'lucide-react';

const ITEM_CONFIG = {
  plan: { label: 'Plan', icon: FileText, color: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500' },
  activity: { label: 'Actividad', icon: Sparkles, color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  resource: { label: 'Recurso', icon: Package, color: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500' },
  course: { label: 'Curso', icon: GraduationCap, color: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
};

const formatMoney = (amount, currency) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: currency || 'CLP', minimumFractionDigits: 0 }).format(amount);

const ProductCard = ({ product, onBuy, isPurchased = false }) => {
  const {
    title, description, price, currency, seller_name,
    rating, total_reviews, item_type, image_url, gallery_urls
  } = product;

  const displayImage = image_url || (Array.isArray(gallery_urls) && gallery_urls.length > 0 ? gallery_urls[0] : null);

  const config = ITEM_CONFIG[item_type] || ITEM_CONFIG.resource;
  const TypeIcon = config.icon;
  const isFree = price === 0;
  const hasRealRating = rating && rating > 0 && total_reviews > 0;

  return (
    <Card
      className="h-full flex flex-col overflow-hidden bg-white border-slate-200/60 hover:border-slate-300 hover:shadow-lg transition-all duration-300 group cursor-pointer rounded-2xl"
      onClick={() => onBuy && onBuy(product)}
    >
      {/* Image */}
      <div className="relative h-36 sm:h-44 bg-gradient-to-br from-slate-50 to-slate-100/80 overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform">
                <TypeIcon className="h-6 w-6 text-slate-300" />
              </div>
            </div>
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${config.color} border-0 shadow-sm text-[10px] font-semibold tracking-wide gap-1`}>
            <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
            {config.label}
          </Badge>
        </div>

        {/* Free badge */}
        {isFree && !isPurchased && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-emerald-500 text-white border-0 shadow-md text-[10px] font-bold">
              GRATIS
            </Badge>
          </div>
        )}

        {/* Purchased indicator */}
        {isPurchased && (
          <div className="absolute inset-0 bg-emerald-600/10 backdrop-blur-[1px] flex items-center justify-center">
            <Badge className="bg-emerald-600 text-white border-0 shadow-lg text-xs gap-1.5 px-4 py-1.5">
              ✓ Adquirido
            </Badge>
          </div>
        )}

        {/* Gradient overlay at bottom for readability */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/5 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 pb-2 flex-grow space-y-2">
        {/* Title */}
        <h3 className="font-semibold text-sm sm:text-[15px] leading-snug line-clamp-2 text-slate-900 group-hover:text-teal-700 transition-colors">
          {title}
        </h3>

        {/* Rating — REAL or "Nuevo", never hardcoded */}
        <div className="flex items-center gap-2">
          {hasRealRating ? (
            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-amber-700">{Number(rating).toFixed(1)}</span>
              <span className="text-[10px] text-amber-600/60">({total_reviews})</span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full font-medium">
              Nuevo
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Seller */}
        {seller_name && seller_name !== 'Vendedor Desconocido' && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate max-w-[160px]">{seller_name}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-4 pt-3 mt-auto border-t border-slate-100/80 flex items-center justify-between gap-2">
        <div className="flex-shrink-0">
          {isFree ? (
            <span className="text-base sm:text-lg font-bold text-emerald-600">Gratis</span>
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold text-slate-800">{formatMoney(price, currency)}</span>
              <span className="text-[8px] sm:text-[9px] text-slate-400 font-medium uppercase tracking-wider whitespace-nowrap">único</span>
            </div>
          )}
        </div>

        <Button
          size="sm"
          className="bg-teal-600 hover:bg-teal-700 text-white gap-1 shadow-sm shadow-teal-600/20 rounded-lg text-[11px] sm:text-xs h-8 px-2.5 sm:px-3 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (onBuy) onBuy(product);
          }}
        >
          <span className="hidden sm:inline">Ver recurso</span>
          <span className="sm:hidden">Ver</span>
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
};

export default ProductCard;