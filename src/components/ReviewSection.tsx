import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/utils/axiosInstance';
import { useAuth } from '@/src/context/AuthContext';
import Toast from 'react-native-toast-message';

interface ReviewUser {
  id: number;
  username: string;
  avatar?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  userId: number;
  productId: string;
  createdAt: string;
  user?: ReviewUser;
}

interface ReviewSectionProps {
  productId: string;
}

function StarRow({
  rating,
  size = 14,
  interactive = false,
  onRate,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (r: number) => void;
}) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          disabled={!interactive}
          onPress={() => onRate && onRate(star)}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
        >
          <Ionicons
            name={star <= rating ? 'star' : 'star-outline'}
            size={size}
            color={star <= rating ? '#F59E0B' : '#D1D5DB'}
            style={{ marginRight: 2 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}yr ago`;
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [showAll, setShowAll] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/review/product/${productId}`);
      if (res.data?.success) {
        setReviews(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const handleSubmitReview = async () => {
    if (!user) {
      Toast.show({ type: 'error', text1: 'Login Required', text2: 'Please log in to write a review.' });
      return;
    }
    if (newRating === 0) {
      Toast.show({ type: 'error', text1: 'Select a rating', text2: 'Please tap the stars to give a rating.' });
      return;
    }
    try {
      setSubmitting(true);
      await api.post('/review', {
        productId,
        rating: newRating,
        comment: newComment.trim(),
      });
      Toast.show({ type: 'success', text1: 'Review submitted!', text2: 'Thank you for your feedback.' });
      setModalVisible(false);
      setNewRating(0);
      setNewComment('');
      fetchReviews();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to submit review.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const visibleReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.sectionTitle}>Customer Reviews</Text>
          <Text style={styles.reviewCount}>
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.writeBtn}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="pencil-outline" size={14} color="#850404" />
          <Text style={styles.writeBtnText}>Write a Review</Text>
        </TouchableOpacity>
      </View>

      {/* Rating Summary */}
      {reviews.length > 0 && (
        <View style={styles.ratingCard}>
          <View style={styles.ratingLeft}>
            <Text style={styles.bigRating}>{avgRating.toFixed(1)}</Text>
            <StarRow rating={Math.round(avgRating)} size={16} />
            <Text style={styles.ratingLabel}>out of 5</Text>
          </View>
          <View style={styles.ratingRight}>
            {ratingCounts.map(({ star, count }) => (
              <View key={star} style={styles.barRow}>
                <Text style={styles.barLabel}>{star}</Text>
                <Ionicons name="star" size={10} color="#F59E0B" />
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width:
                          reviews.length > 0
                            ? `${(count / reviews.length) * 100}%`
                            : '0%',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Reviews List */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#850404" />
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="chatbubbles-outline" size={36} color="#D1D5DB" />
          <Text style={styles.emptyText}>No reviews yet</Text>
          <Text style={styles.emptySubText}>Be the first to share your experience!</Text>
        </View>
      ) : (
        <>
          {visibleReviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(review.user?.username || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.reviewMeta}>
                  <Text style={styles.reviewerName}>
                    {review.user?.username || 'Anonymous'}
                  </Text>
                  <View style={styles.reviewMetaRow}>
                    <StarRow rating={review.rating} size={12} />
                    <Text style={styles.reviewDate}>{'  · '}{timeAgo(review.createdAt)}</Text>
                  </View>
                </View>
              </View>
              {review.comment ? (
                <Text style={styles.reviewComment}>{review.comment}</Text>
              ) : null}
            </View>
          ))}
          {reviews.length > 3 && (
            <TouchableOpacity
              style={styles.showMoreBtn}
              onPress={() => setShowAll(!showAll)}
            >
              <Text style={styles.showMoreText}>
                {showAll ? 'Show Less' : `Show all ${reviews.length} reviews`}
              </Text>
              <Ionicons
                name={showAll ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#850404"
              />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Submit Review Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Write a Review</Text>
              <Text style={styles.modalSubtitle}>Share your experience with this product</Text>

              <View style={styles.starSelectorBox}>
                <Text style={styles.starSelectorLabel}>Your Rating</Text>
                <StarRow rating={newRating} size={36} interactive onRate={setNewRating} />
                <Text style={styles.ratingWord}>
                  {newRating === 0 ? 'Tap to rate' : newRating === 1 ? 'Poor' : newRating === 2 ? 'Fair' : newRating === 3 ? 'Good' : newRating === 4 ? 'Very Good' : 'Excellent!'}
                </Text>
              </View>

              <View style={styles.commentBox}>
                <Text style={styles.commentLabel}>Your Review (optional)</Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="What did you love or dislike about this product?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  value={newComment}
                  onChangeText={setNewComment}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{newComment.length}/500</Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Review</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setModalVisible(false);
                  setNewRating(0);
                  setNewComment('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginBottom: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 2 },
  reviewCount: { fontSize: 12, color: '#6B7280' },
  writeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#850404', backgroundColor: '#FFF5F5' },
  writeBtnText: { fontSize: 12, color: '#850404', fontWeight: '600' },
  ratingCard: { flexDirection: 'row', backgroundColor: '#FAFAF8', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F0EAE0', gap: 16 },
  ratingLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  bigRating: { fontSize: 40, fontWeight: '800', color: '#111827', lineHeight: 46 },
  ratingLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  ratingRight: { flex: 1, gap: 5, justifyContent: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  barLabel: { fontSize: 11, color: '#374151', width: 10, textAlign: 'right' },
  barTrack: { flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#F59E0B', borderRadius: 3 },
  barCount: { fontSize: 11, color: '#6B7280', width: 16, textAlign: 'right' },
  loadingBox: { paddingVertical: 16, alignItems: 'center' },
  emptyBox: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#9CA3AF' },
  emptySubText: { fontSize: 12, color: '#D1D5DB' },
  reviewCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#F0EBE1', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#850404', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  reviewMeta: { flex: 1 },
  reviewerName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  reviewMetaRow: { flexDirection: 'row', alignItems: 'center' },
  starRow: { flexDirection: 'row', alignItems: 'center' },
  reviewDate: { fontSize: 11, color: '#9CA3AF' },
  reviewComment: { fontSize: 13, color: '#374151', lineHeight: 20 },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginTop: 4, backgroundColor: '#FAFAF8' },
  showMoreText: { fontSize: 13, color: '#850404', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 24 },
  starSelectorBox: { alignItems: 'center', backgroundColor: '#FAFAF8', borderRadius: 12, paddingVertical: 20, paddingHorizontal: 16, marginBottom: 20, borderWidth: 1, borderColor: '#F0EBE1' },
  starSelectorLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  ratingWord: { marginTop: 10, fontSize: 15, fontWeight: '600', color: '#850404' },
  commentBox: { marginBottom: 20 },
  commentLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  commentInput: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 14, color: '#111827', minHeight: 110, backgroundColor: '#FAFAFA' },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  submitBtn: { backgroundColor: '#850404', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
});
