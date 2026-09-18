import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWishlist } from '@/src/context/WishlistContext';
import { useCart } from '@/src/context/CartContext';
import { useAuth } from '@/src/context/AuthContext';
import Toast from 'react-native-toast-message';
import api from '@/src/utils/axiosInstance';

const { width } = Dimensions.get('window');

export interface ProductCardProps {
  product: {
    id: string;
    productName: string;
    price: string;
    finalPrice: string;
    productImages?: string[];
    category?: { category: string };
  };
  style?: object;
  width?: number | string;
}

export default function ProductCard({ product, style, width: customWidth }: ProductCardProps) {
  const router = useRouter();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();

  const isWishlisted = isInWishlist(product.id);

  // Lazy-load review stats
  const [reviewAvg, setReviewAvg] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    // Stagger to avoid hammering API when a grid of cards loads simultaneously
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/review/product/${product.id}`);
        if (res.data?.success && res.data.data.length > 0) {
          const reviews: any[] = res.data.data;
          const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
          setReviewAvg(parseFloat(avg.toFixed(1)));
          setReviewCount(reviews.length);
        }
      } catch {
        // silently ignore — reviews are supplementary
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [product.id]);
  
  const priceNum = parseFloat(product.price || '0');
  const finalPriceNum = parseFloat(product.finalPrice || '0');
  const discountPercent = priceNum > finalPriceNum ? Math.round(((priceNum - finalPriceNum) / priceNum) * 100) : 0;

  const getImageUrl = (images?: string[]) => {
    if (!images || images.length === 0) return 'https://via.placeholder.com/150';
    let url = images[0];
    if (url.startsWith('/')) {
      return `https://api.prabhatex.in${url}`;
    }
    return url;
  };

  const handleToggleWishlist = () => {
    if (!user) {
      Toast.show({ type: 'info', text1: 'Login Required', text2: 'Please login to add to wishlist' });
      router.push('/login');
      return;
    }

    if (isWishlisted) {
      removeFromWishlist(product.id);
      Toast.show({ type: 'info', text1: 'Removed from Wishlist', text2: `${product.productName} removed.` });
    } else {
      addToWishlist({
        id: product.id,
        name: product.productName,
        price: priceNum,
        finalPrice: finalPriceNum,
        image: product.productImages?.[0] || '',
      });
      Toast.show({ type: 'success', text1: 'Added to Wishlist', text2: `${product.productName} saved!` });
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.card, customWidth ? { width: customWidth } : { flex: 1 }, style]}
      activeOpacity={0.9}
      onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: getImageUrl(product.productImages) }} style={styles.image} />
        
        {/* Wishlist Heart Overlay */}
        <TouchableOpacity style={styles.wishlistBtn} onPress={handleToggleWishlist} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons 
            name={isWishlisted ? "heart" : "heart-outline"} 
            size={18} 
            color={isWishlisted ? "#850404" : "#1A1A1A"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        {/* Category Name below image */}
        {product.category?.category && (
          <Text style={styles.categoryText} numberOfLines={1}>
            {product.category.category}
          </Text>
        )}

        {/* Product Name */}
        <Text style={styles.title} numberOfLines={2}>{product.productName}</Text>

        {/* Rating Row — 5 stars default, real data when reviews exist */}
        <View style={styles.ratingRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name="star"
              size={10}
              color={
                reviewCount > 0
                  ? star <= Math.round(reviewAvg ?? 0) ? '#F59E0B' : '#E5E7EB'
                  : '#F59E0B' // all gold when no reviews (default 5★)
              }
            />
          ))}
          {reviewCount > 0 ? (
            <Text style={styles.ratingCount}>
              {reviewAvg} ({reviewCount})
            </Text>
          ) : (
            <Text style={styles.ratingNoReview}>New</Text>
          )}
        </View>

        {/* Pricing Row */}
        <View style={styles.priceRow}>
          <Text style={styles.finalPrice}>₹{finalPriceNum.toLocaleString('en-IN')}</Text>
          {discountPercent > 0 && (
            <Text style={styles.originalPrice}>₹{priceNum.toLocaleString('en-IN')}</Text>
          )}
          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        {/* Add to Cart Button */}
        <TouchableOpacity 
          style={styles.addToCartBtn} 
          onPress={() => {
            if (!user) {
              Toast.show({ type: 'info', text1: 'Login Required', text2: 'Please login to add to cart' });
              router.push('/login');
              return;
            }

            addToCart({
              id: product.id,
              name: product.productName,
              price: finalPriceNum,
              image: product.productImages?.[0] || '',
              quantity: 1,
              maxStock: 10,
            });
            Toast.show({ type: 'success', text1: 'Added to Cart', text2: `${product.productName} added!` });
          }}
        >
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 6,
    backgroundColor: '#FFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F0EBE1',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.88,
    backgroundColor: '#F8F6F0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  infoContainer: {
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 18,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  finalPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#850404',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#850404',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  addToCartBtn: {
    backgroundColor: '#850404',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  addToCartText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Category label below image
  categoryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#850404',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  // Rating row
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 5,
  },
  ratingCount: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 2,
  },
  ratingNoReview: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
    marginLeft: 3,
  },
});
