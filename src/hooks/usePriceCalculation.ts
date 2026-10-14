// usePriceCalculation Hook
// Marcus: "This hook handles async price fetching. A bit janky but works."

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  Configuration,
  Product,
  PriceBreakdown,
} from '../components/ProductConfigurator/types';
import { calculatePrice } from '../services/api';

interface UsePriceCalculationResult {
  price: PriceBreakdown | null;
  formattedTotal: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook for managing price calculation
 */

export function usePriceCalculation(
  config: Configuration | null,
  product: Product,
): UsePriceCalculationResult {
  const [price, setPrice] = useState<PriceBreakdown | null>(null);
  const [pricedFor, setPricedFor] = useState<{
    config: Configuration;
    product: Product;
    refetchKey: number;
  } | null>(null);
  const [formattedTotal, setFormattedTotal] = useState('$0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);
  const latestConfigRef = useRef(config);
  const selections = config?.selections;
  const addOns = config?.addOns;
  const quantity = config?.quantity;

  // Keep request metadata current without recalculating when only the name changes.
  useEffect(() => {
    latestConfigRef.current = config;
  }, [config]);

  useEffect(() => {
    let ignore = false;
    const requestConfig = latestConfigRef.current;

    const fetchPrice = async () => {
      if (!requestConfig) {
        setPrice(null);
        setFormattedTotal('$0.00');
        setIsLoading(false);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await calculatePrice(requestConfig, product);

        if (ignore) return;

        setPrice(response.breakdown);
        setPricedFor({ config: requestConfig, product, refetchKey });
        setFormattedTotal(response.formattedTotal);
      } catch {
        if (ignore) return;

        setError('ERR_PRICE_CALC_FAILED');
        setPrice(null);
        setFormattedTotal('—');
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void fetchPrice();

    return () => {
      ignore = true;
    };
  }, [selections, addOns, quantity, product, refetchKey]);

  const refetch = useCallback(() => {
    setRefetchKey((prev) => prev + 1);
  }, []);

  // Reject stale prices during render, before the fetching effect sets isLoading.
  const isPriceCurrent =
    config !== null &&
    pricedFor !== null &&
    pricedFor.config.selections === selections &&
    pricedFor.config.addOns === addOns &&
    pricedFor.config.quantity === quantity &&
    pricedFor.product === product &&
    pricedFor.refetchKey === refetchKey;

  return {
    price: isPriceCurrent ? price : null,
    formattedTotal,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Debounced version of price calculation
 */
export function useDebouncedPriceCalculation(
  config: Configuration | null,
  product: Product,
  delay: number = 300,
): UsePriceCalculationResult {
  const [price, setPrice] = useState<PriceBreakdown | null>(null);
  const [formattedTotal, setFormattedTotal] = useState<string>('$0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const configRef = useRef(config);

  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!config) {
      setPrice(null);
      setFormattedTotal('$0.00');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await calculatePrice(configRef.current!, product);
        setPrice(response.breakdown);
        setFormattedTotal(response.formattedTotal);
        setError(null);
      } catch {
        setError('ERR_PRICE_CALC_FAILED');
      } finally {
        setIsLoading(false);
      }
    }, delay);

    configRef.current = config;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [config, product, delay]);

  const refetch = useCallback(() => {
    if (config) {
      setIsLoading(true);
      calculatePrice(config, product)
        .then((response) => {
          setPrice(response.breakdown);
          setFormattedTotal(response.formattedTotal);
          setError(null);
        })
        .catch(() => {
          setError('ERR_PRICE_CALC_FAILED');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [config, product]);

  return {
    price,
    formattedTotal,
    isLoading,
    error,
    refetch,
  };
}
