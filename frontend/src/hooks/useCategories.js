import { useContext } from 'react';
import { CategoriesContext } from '../contexts/CategoriesContext';

/**
 * Custom hook for using categories throughout the application
 * Provides easy access to categories data and actions
 */
export const useCategories = () => {
  const context = useContext(CategoriesContext);
  
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoriesProvider');
  }
  
  return context;
};

/**
 * Hook for categories dropdown/select options
 * Returns categories in a format suitable for dropdowns
 */
export const useCategoriesOptions = () => {
  const { categories } = useCategories();
  
  return categories.map(category => ({
    value: category._id,
    label: category.name,
    color: category.color,
    budget: category.budget,
    spent: category.spent
  }));
};

/**
 * Hook for category statistics
 * Returns computed stats for all categories or a specific one
 */
export const useCategoryStats = (categoryId = null) => {
  const { categories } = useCategories();
  
  if (categoryId) {
    const category = categories.find(cat => cat._id === categoryId);
    if (!category) return null;
    
    const budget = Number(category.budget) || 0;
    const spent = Number(category.spent) || 0;
    const usage = budget > 0 ? (spent / budget) * 100 : 0;
    const remaining = budget - spent;

    return {
      category,
      usagePercentage: Math.max(0, usage),
      remaining,
      isOverBudget: budget > 0 && spent > budget,
      status: budget > 0 && spent > budget ? 'over' : usage > 75 ? 'warning' : 'good'
    };
  }
  
  // Return stats for all categories
  const totalBudget = categories.reduce((sum, cat) => sum + (Number(cat.budget) || 0), 0);
  const totalSpent = categories.reduce((sum, cat) => sum + (Number(cat.spent) || 0), 0);
  const overBudgetCategories = categories.filter(cat => {
    const budget = Number(cat.budget) || 0;
    const spent = Number(cat.spent) || 0;
    return budget > 0 && spent > budget;
  });
  
  return {
    totalBudget,
    totalSpent,
    totalRemaining: totalBudget - totalSpent,
    overallUsage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    categoriesCount: categories.length,
    overBudgetCount: overBudgetCategories.length,
    overBudgetCategories
  };
};

/**
 * Hook for finding categories by various criteria
 */
export const useCategoryFinder = () => {
  const { categories } = useCategories();
  
  return {
    findById: (id) => categories.find(cat => cat._id === id),
    findByName: (name) => categories.find(cat => cat.name.toLowerCase() === name.toLowerCase()),
    findByColor: (color) => categories.filter(cat => cat.color === color),
    findOverBudget: () => categories.filter(cat => {
      const budget = Number(cat.budget) || 0;
      const spent = Number(cat.spent) || 0;
      return budget > 0 && spent > budget;
    }),
    findUnderBudget: () => categories.filter(cat => {
      const budget = Number(cat.budget) || 0;
      const spent = Number(cat.spent) || 0;
      return budget > 0 && spent < budget;
    }),
    findWithBudget: () => categories.filter(cat => Number(cat.budget) > 0),
    findWithoutBudget: () => categories.filter(cat => Number(cat.budget) === 0)
  };
};