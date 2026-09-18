import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ActivityIndicator, ScrollView, Dimensions, TextInput, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/utils/axiosInstance';
import SearchBarHeader from '@/src/components/SearchBarHeader';
import { useCart } from '@/src/context/CartContext';
import { useWishlist } from '@/src/context/WishlistContext';
import Toast from 'react-native-toast-message';
import RelatedProducts from '@/src/components/RelatedProducts';
import RecentlyViewedProducts from '@/src/components/RecentlyViewedProducts';
import ReviewSection from '@/src/components/ReviewSection';
import { useRecentlyViewed } from '@/src/hooks/useRecentlyViewed';

const { width, height } = Dimensions.get('window');

interface Product {
  id: string;
  productName: string;
  productDescription?: string;
  price: string;
  finalPrice: string;
  stockQuantity: number;
  productImages: string[];
  type?: string;
  categoryId?: string;
  category?: { category: string };
  colors?: any[];
}

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [careExpanded, setCareExpanded] = useState(false);

  // Real review stats (fetched by ReviewSection, mirrored here for the header row)
  const [reviewStats, setReviewStats] = useState({ avg: 0, count: 0 });
  
  const flatListRef = useRef<FlatList>(null);
  
  // Cart & Wishlist connection
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isWishlisted = isInWishlist(id as string);
  
  // State for Image Zoom Modal
  const [isZoomVisible, setIsZoomVisible] = useState(false);

  // Recently Viewed hook
  const { addProductToRecentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/getProductById/${id}`);
        if (res.data && res.data.success) {
          const fetchedProduct = res.data.data;
          setProduct(fetchedProduct);
          // Add to recently viewed
          addProductToRecentlyViewed({
            id: fetchedProduct.id,
            productName: fetchedProduct.productName,
            price: fetchedProduct.price,
            finalPrice: fetchedProduct.finalPrice,
            productImages: fetchedProduct.productImages || [],
          });
        }
      } catch (err) {
        console.error('Failed to fetch product details:', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, addProductToRecentlyViewed]);

  // Fetch review stats for the header rating row
  useEffect(() => {
    if (!id) return;
    api.get(`/review/product/${id}`).then((res) => {
      if (res.data?.success && res.data.data.length > 0) {
        const reviews = res.data.data;
        const avg = reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length;
        setReviewStats({ avg: parseFloat(avg.toFixed(1)), count: reviews.length });
      }
    }).catch(() => {});
  }, [id]);

  const getImageUrl = (url?: string) => {
    if (!url) return 'https://via.placeholder.com/400';
    if (url.startsWith('/')) {
      const baseHost = 'http://10.93.111.50:8080';
      return `${baseHost}${url}`;
    }
    return url;
  };

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== activeImageIndex) {
      setActiveImageIndex(roundIndex);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#850404" />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Product not found.</Text>
        <TouchableOpacity style={styles.backButtonInline} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const price = parseFloat(product.price || '0');
  const finalPrice = parseFloat(product.finalPrice || '0');
  const discountPercent = price > finalPrice ? Math.round(((price - finalPrice) / price) * 100) : 0;
  const images = product.productImages?.length ? product.productImages : [''];

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.productName,
      price: finalPrice,
      image: images[0],
      quantity: qty,
      maxStock: product.stockQuantity,
    });
    Toast.show({
      type: 'success',
      text1: 'Added to Cart',
      text2: `${product.productName} was added successfully!`,
    });
  };

  const handleBuyNow = async () => {
    // Add to cart first
    await addToCart({
      id: product.id,
      name: product.productName,
      price: finalPrice,
      image: images[0],
      quantity: qty,
      maxStock: product.stockQuantity,
    });
    router.push('/checkout');
  };

  const handleToggleWishlist = () => {
    if (isWishlisted) {
      removeFromWishlist(id as string);
      Toast.show({ type: 'info', text1: 'Removed from Wishlist', text2: `${product.productName} removed.` });
    } else {
      addToWishlist({
        id: product.id,
        name: product.productName,
        price,
        finalPrice,
        image: images[0],
      });
      Toast.show({ type: 'success', text1: 'Added to Wishlist', text2: `${product.productName} saved!` });
    }
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── HEADER ── */}
      <SearchBarHeader 
        showCart={true}
        showShare={true}
        placeholder="Search products..."
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── IMAGE GALLERY CARD ── */}
        <View style={styles.galleryWrapper}>
          <View style={styles.galleryContainer}>
            <FlatList
              ref={flatListRef}
              data={images}
              keyExtractor={(_: string, index: number) => index.toString()}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleScroll}
              renderItem={({ item }: { item: string }) => (
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  style={{ width: width - 32, height: '100%' }} // galleryContainer is width - 32 because of paddingHorizontal 16
                  onPress={() => setIsZoomVisible(true)}
                >
                  <Image source={{ uri: getImageUrl(item) }} style={styles.mainImage} />
                  <View style={styles.zoomHint}>
                    <Ionicons name="scan-outline" size={18} color="rgba(255,255,255,0.9)" />
                  </View>
                </TouchableOpacity>
              )}
            />
            
            <View style={styles.imageOverlayTopRight}>
              <TouchableOpacity style={styles.wishlistCircle}>
                <Ionicons name="heart-outline" size={20} color="#850404" />
              </TouchableOpacity>
            </View>

            <View style={styles.imageOverlayBottomLeft}>
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>{activeImageIndex + 1} / {images.length}</Text>
              </View>
              <View style={styles.paginationDots}>
                {images.map((_, idx) => (
                  <View key={idx} style={[styles.dot, activeImageIndex === idx ? styles.activeDot : null]} />
                ))}
              </View>
            </View>
          </View>
          
          {/* Horizontal Thumbnails Below Image */}
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailsContainerHorizontal}>
              {images.map((img, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={[styles.thumbnailWrapperHorizontal, activeImageIndex === idx && styles.thumbnailActive]}
                  onPress={() => {
                    setActiveImageIndex(idx);
                    flatListRef.current?.scrollToOffset({ offset: idx * (width - 32), animated: true });
                  }}
                >
                  <Image source={{ uri: getImageUrl(img) }} style={styles.thumbnailImage} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── PRODUCT INFO ── */}
        <View style={styles.infoContainer}>
          <Text style={styles.categoryEyebrow}>
            {product.category?.category || 'COLLECTION'}
          </Text>
          <Text style={styles.productTitle}>{product.productName}</Text>
          
          <View style={styles.ratingRow}>
            {reviewStats.count > 0 ? (
              <>
                <Ionicons name="star" size={16} color="#FBBF24" />
                <Text style={styles.ratingText}>
                  {reviewStats.avg}{' '}
                  <Text style={styles.ratingCount}>({reviewStats.count} {reviewStats.count === 1 ? 'review' : 'reviews'})</Text>
                </Text>
                <Text style={styles.ratingDivider}>|</Text>
              </>
            ) : null}
            <Text style={product.stockQuantity > 0 ? styles.inStockText : styles.outOfStockText}>
              {product.stockQuantity > 0 ? 'In stock' : 'Out of stock'}
            </Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>₹{finalPrice.toLocaleString('en-IN')}</Text>
            {discountPercent > 0 && (
              <>
                <Text style={styles.originalPrice}>₹{price.toLocaleString('en-IN')}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPercent}% OFF</Text>
                </View>
              </>
            )}
          </View>
          
          {product.productDescription ? (
            <Text style={styles.shortDesc} numberOfLines={2}>
              {product.productDescription}
            </Text>
          ) : (
            <Text style={styles.shortDesc}>Handwoven elegance, directly from the looms.</Text>
          )}

          {/* ── COLOR SELECTOR ── */}
          {product.colors && product.colors.length > 0 && (
            <View style={styles.sectionSpacing}>
              <View style={styles.rowBetween}>
                <Text style={styles.sectionHeading}>Select Colour</Text>
                <Text style={styles.selectedColorText}>{product.colors[0]?.color || 'Default'}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorScroll}>
                {product.colors.map((c, idx) => (
                  <TouchableOpacity key={idx} style={[styles.colorCircle, idx === 0 && styles.colorCircleActive]}>
                    <View style={[styles.colorInner, { backgroundColor: c.hex || '#000' }]} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── QUANTITY ── */}
          <View style={[styles.rowBetween, styles.sectionSpacing]}>
            <Text style={styles.sectionHeading}>Quantity</Text>
            <View style={styles.qtyContainer}>
              <View style={styles.stepper}>
                <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={styles.stepperBtn}>
                  <Ionicons name="remove" size={18} color="#333" />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{qty}</Text>
                <TouchableOpacity onPress={() => setQty(Math.min(product.stockQuantity, qty + 1))} style={styles.stepperBtn}>
                  <Ionicons name="add" size={18} color="#333" />
                </TouchableOpacity>
              </View>
              {product.stockQuantity > 0 && product.stockQuantity < 10 && (
                <Text style={styles.stockWarning}>Only {product.stockQuantity} left</Text>
              )}
            </View>
          </View>

          {/* ── ACCORDIONS ── */}
          <View style={styles.accordions}>
            <TouchableOpacity style={styles.accordionHeader} onPress={() => setDetailsExpanded(!detailsExpanded)}>
              <View style={styles.accordionHeaderLeft}>
                <Ionicons name="document-text-outline" size={22} color="#850404" />
                <Text style={styles.accordionTitle}>Description</Text>
              </View>
              <Ionicons name={detailsExpanded ? "chevron-up" : "chevron-down"} size={20} color="#000" />
            </TouchableOpacity>
            {detailsExpanded && (
              <View style={styles.accordionBody}>
                {product.productDescription ? (
                  <View style={styles.bulletList}>
                    {product.productDescription
                      .split(/(?:\n|\.\s+)/)
                      .filter((p) => p.trim() !== '')
                      .map((point, index) => (
                        <View key={index} style={styles.bulletRow}>
                          <Text style={styles.bulletPoint}>•</Text>
                          <Text style={styles.accordionText}>{point.trim()}</Text>
                        </View>
                      ))}
                  </View>
                ) : (
                  <Text style={styles.accordionText}>No details available.</Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.accordionHeader} onPress={() => setCareExpanded(!careExpanded)}>
              <View style={styles.accordionHeaderLeft}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#850404" />
                <Text style={styles.accordionTitle}>Care Instructions</Text>
              </View>
              <Ionicons name={careExpanded ? "chevron-up" : "chevron-down"} size={20} color="#000" />
            </TouchableOpacity>
            {careExpanded && (
              <View style={styles.accordionBody}>
                <View style={styles.bulletList}>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.accordionText}>Dry clean only</Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.accordionText}>Do not bleach</Text>
                  </View>
                  <View style={styles.bulletRow}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.accordionText}>Store in a cool, dry place</Text>
                  </View>
                </View>
              </View>
            )}
            <View style={styles.accordionBottomBorder} />
          </View>

          {/* ── TRUST BADGES ── */}
          <View style={styles.trustRow}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#850404" />
            <Text style={styles.trustText}>Original weave · Quality checked</Text>
          </View>

        </View>

        {/* ── REVIEWS SECTION ── */}
        <View style={styles.reviewDivider} />
        <ReviewSection productId={id as string} />

        {/* ── RELATED PRODUCTS ── */}
        <RelatedProducts categoryId={product.categoryId} currentProductId={product.id} />

        {/* ── RECENTLY VIEWED PRODUCTS ── */}
        <RecentlyViewedProducts currentProductId={product.id} />

      </ScrollView>

      {/* ── STICKY BOTTOM BAR ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomWishlistBtn} onPress={handleToggleWishlist}>
          <Ionicons 
            name={isWishlisted ? "heart" : "heart-outline"} 
            size={24} 
            color={isWishlisted ? "#e91e63" : "#850404"} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addToCartBtn} 
          disabled={product.stockQuantity <= 0}
          onPress={handleAddToCart}
        >
          <Text style={styles.addToCartBtnText}>Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.buyNowBtn} 
          disabled={product.stockQuantity <= 0}
          onPress={handleBuyNow}
        >
          <Text style={styles.buyNowBtnText}>Buy Now</Text>
        </TouchableOpacity>
      </View>

      {/* ── ZOOM MODAL ── */}
      <Modal visible={isZoomVisible} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <SafeAreaView style={styles.modalSafe} edges={['top', 'bottom']}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsZoomVisible(false)}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            
            <ScrollView 
              contentContainerStyle={styles.zoomScrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              centerContent={true}
            >
              <Image 
                source={{ uri: getImageUrl(images[activeImageIndex]) }} 
                style={styles.zoomImage} 
                resizeMode="contain" 
              />
            </ScrollView>
            
            {/* Modal Thumbnail Navigation */}
            {images.length > 1 && (
              <View style={styles.modalThumbnails}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalThumbScroll}>
                  {images.map((img, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={[styles.modalThumbItem, activeImageIndex === idx && styles.modalThumbItemActive]}
                      onPress={() => setActiveImageIndex(idx)}
                    >
                      <Image source={{ uri: getImageUrl(img) }} style={styles.modalThumbImage} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#850404' },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20, borderWidth: 1, borderColor: '#F0F0F0' },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconButtonRight: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  badge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#850404', width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  scrollContent: { paddingBottom: 100 },

  // Gallery
  galleryWrapper: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, backgroundColor: '#FAF8F5' },
  galleryContainer: { width: '100%', height: width * 1.2, position: 'relative', backgroundColor: '#F0F0F0', borderRadius: 16, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 } },
  mainImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  zoomHint: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 16, width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  imageOverlayTopRight: { position: 'absolute', top: 12, right: 12 },
  wishlistCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  imageOverlayBottomLeft: { position: 'absolute', bottom: 16, left: 16, flexDirection: 'row', alignItems: 'center', gap: 12, pointerEvents: 'none' },
  imageCounter: { backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  imageCounterText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  paginationDots: { flexDirection: 'row', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  activeDot: { backgroundColor: '#FFF' },
  
  thumbnailsContainerHorizontal: { flexDirection: 'row', gap: 10, marginTop: 12, paddingBottom: 4 },
  thumbnailWrapperHorizontal: { width: 56, height: 70, borderRadius: 8, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden', backgroundColor: '#FFF' },
  thumbnailActive: { borderColor: '#850404' },
  thumbnailImage: { width: '100%', height: '100%', resizeMode: 'cover' },

  // Info
  infoContainer: { padding: 16 },
  categoryEyebrow: { fontSize: 11, fontWeight: '700', color: '#666', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  productTitle: { fontSize: 22, fontWeight: '700', color: '#1A1A1A', lineHeight: 28, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ratingText: { fontSize: 13, fontWeight: '700', color: '#333', marginLeft: 4 },
  ratingCount: { fontWeight: '400', color: '#666' },
  ratingDivider: { color: '#CCC', marginHorizontal: 8 },
  inStockText: { fontSize: 13, fontWeight: '600', color: '#059669' },
  outOfStockText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },
  
  priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  currentPrice: { fontSize: 24, fontWeight: 'bold', color: '#1A1A1A', marginRight: 10 },
  originalPrice: { fontSize: 16, color: '#888', textDecorationLine: 'line-through', marginRight: 10 },
  discountBadge: { backgroundColor: '#850404', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
  discountText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  
  shortDesc: { fontSize: 13, color: '#555', lineHeight: 20, marginBottom: 20 },
  sectionSpacing: { marginBottom: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionHeading: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  
  selectedColorText: { fontSize: 13, color: '#059669', fontWeight: '500' },
  colorScroll: { flexDirection: 'row' },
  colorCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#EEE', padding: 2, marginRight: 10 },
  colorCircleActive: { borderColor: '#850404' },
  colorInner: { flex: 1, borderRadius: 16 },

  qtyContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 6 },
  stepperBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  stepperValue: { width: 32, textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  stockWarning: { fontSize: 12, color: '#D97706', fontWeight: '600' },

  // Accordions
  accordions: { marginTop: 12, marginBottom: 24 },
  accordionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#EAEAEA' },
  accordionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accordionTitle: { fontSize: 16, fontWeight: '700', color: '#000000', letterSpacing: 0.3 },
  accordionBody: { paddingBottom: 16, paddingHorizontal: 4 },
  accordionText: { fontSize: 14, color: '#000000', lineHeight: 24, letterSpacing: 0.2, flex: 1 },
  bulletList: { gap: 6 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', paddingRight: 10 },
  bulletPoint: { fontSize: 18, color: '#000000', marginRight: 8, lineHeight: 24 },
  accordionBottomBorder: { borderTopWidth: 1, borderTopColor: '#EAEAEA' },

  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 },
  trustText: { fontSize: 12, color: '#850404', fontWeight: '500' },
  reviewDivider: { height: 8, backgroundColor: '#F5F5F5', marginVertical: 8 },

  // Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 12, paddingBottom: 24, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE', gap: 10 },
  bottomWishlistBtn: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#850404', borderRadius: 6 },
  addToCartBtn: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#850404', borderRadius: 6 },
  addToCartBtnText: { color: '#850404', fontSize: 14, fontWeight: '700' },
  buyNowBtn: { flex: 1, height: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: '#850404', borderRadius: 6 },
  buyNowBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  errorText: { fontSize: 16, color: '#333', marginBottom: 16 },
  backButtonInline: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  backButtonText: { color: '#850404', fontWeight: 'bold' },

  // Zoom Modal
  modalBackground: { flex: 1, backgroundColor: '#000' },
  modalSafe: { flex: 1, position: 'relative' },
  modalCloseButton: { position: 'absolute', top: 40, right: 20, zIndex: 50, width: 44, height: 44, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 22 },
  zoomScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  zoomImage: { width: width, height: height * 0.7 },
  modalThumbnails: { position: 'absolute', bottom: 40, left: 0, right: 0, height: 80, justifyContent: 'center', alignItems: 'center' },
  modalThumbScroll: { paddingHorizontal: 20, gap: 12, alignItems: 'center' },
  modalThumbItem: { width: 50, height: 64, borderRadius: 8, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' },
  modalThumbItemActive: { borderColor: '#FFF' },
  modalThumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
});
