/**
 * Utility to calculate days remaining until asset deadline / expiry
 * and format user-friendly status badges for White & Orange Theme
 */
export function getExpiryInfo(asset) {
  const expiry = asset?.warranty?.end || asset?.warranty?.endDate || asset?.expiryDate;
  if (!expiry) {
    return { 
      hasExpiry: false, 
      label: 'No Deadline Set', 
      shortLabel: '—',
      badgeClass: 'bg-slate-100 text-slate-500 border-slate-200', 
      color: 'slate', 
      days: null,
      dateFormatted: '—'
    };
  }

  const end = new Date(expiry);
  if (isNaN(end.getTime())) {
    return { 
      hasExpiry: false, 
      label: 'Invalid Date', 
      shortLabel: '—',
      badgeClass: 'bg-slate-100 text-slate-500 border-slate-200', 
      color: 'slate', 
      days: null,
      dateFormatted: '—'
    };
  }

  const now = new Date();
  const startOfDayNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDayEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffTime = startOfDayEnd.getTime() - startOfDayNow.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  const dateFormatted = end.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      hasExpiry: true,
      isExpired: true,
      days: diffDays,
      dateFormatted,
      label: `Expired ${daysAgo === 1 ? 'yesterday' : `${daysAgo}d ago`}`,
      shortLabel: `${daysAgo}d overdue`,
      badgeClass: 'bg-red-50 text-red-700 border-red-200 font-semibold',
      color: 'red'
    };
  } else if (diffDays === 0) {
    return {
      hasExpiry: true,
      isUrgent: true,
      days: 0,
      dateFormatted,
      label: 'Expires Today!',
      shortLabel: 'Today',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-300 font-bold animate-pulse',
      color: 'orange'
    };
  } else if (diffDays <= 10) {
    return {
      hasExpiry: true,
      isUrgent: true,
      days: diffDays,
      dateFormatted,
      label: `${diffDays} day${diffDays === 1 ? '' : 's'} left`,
      shortLabel: `${diffDays}d left`,
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 font-semibold',
      color: 'orange'
    };
  } else if (diffDays <= 30) {
    return {
      hasExpiry: true,
      days: diffDays,
      dateFormatted,
      label: `${diffDays} days left`,
      shortLabel: `${diffDays}d left`,
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
      color: 'amber'
    };
  } else {
    return {
      hasExpiry: true,
      days: diffDays,
      dateFormatted,
      label: `${diffDays} days left`,
      shortLabel: `${diffDays}d left`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
      color: 'emerald'
    };
  }
}
