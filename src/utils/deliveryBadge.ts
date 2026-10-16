export interface DeliveryBadgeProps {
  className: string;
  icon: string;
  label: string;
}

export function getDeliveryBadgeProps(deliveryOptionName?: string): DeliveryBadgeProps {
  const name = deliveryOptionName?.trim() || 'Standard Delivery';
  const lower = name.toLowerCase();

  const commonIcon = 'fi-rs-box-alt';

  if (lower.includes('express') || lower.includes('fast') || lower.includes('same day')) {
    return {
      className: 'express-delivery-badge',
      icon: commonIcon,
      label: name,
    };
  }

  if (lower.includes('free')) {
    return {
      className: 'free-delivery-badge',
      icon: commonIcon,
      label: name,
    };
  }

  return {
    className: 'standard-delivery-badge',
    icon: commonIcon,
    label: name,
  };
}
