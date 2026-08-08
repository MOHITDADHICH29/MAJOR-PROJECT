"""Statistical analysis utilities."""

import numpy as np
from scipy import stats
from typing import Dict, Tuple


class StatisticalAnalysis:
    """Statistical testing and analysis."""

    @staticmethod
    def perform_ttest(
        group1: np.ndarray,
        group2: np.ndarray,
    ) -> Dict:
        """
        Perform independent samples t-test.

        Args:
            group1: First group data.
            group2: Second group data.

        Returns:
            Dictionary with test statistics.
        """
        t_stat, p_value = stats.ttest_ind(group1, group2)

        return {
            "t_statistic": t_stat,
            "p_value": p_value,
            "significant": p_value < 0.05,
        }

    @staticmethod
    def perform_mannwhitneyu(
        group1: np.ndarray,
        group2: np.ndarray,
    ) -> Dict:
        """
        Perform Mann-Whitney U test.

        Args:
            group1: First group data.
            group2: Second group data.

        Returns:
            Dictionary with test statistics.
        """
        u_stat, p_value = stats.mannwhitneyu(group1, group2)

        return {
            "u_statistic": u_stat,
            "p_value": p_value,
            "significant": p_value < 0.05,
        }

    @staticmethod
    def mcnemar_test(
        predictions_1: np.ndarray,
        predictions_2: np.ndarray,
        ground_truth: np.ndarray,
    ) -> Dict:
        """
        Perform McNemar's test for comparing paired classifiers.

        Args:
            predictions_1: Predictions from classifier 1.
            predictions_2: Predictions from classifier 2.
            ground_truth: Ground truth labels.

        Returns:
            Dictionary with test statistics.
        """
        # 2x2 contingency table
        both_correct = ((predictions_1 == ground_truth) & 
                       (predictions_2 == ground_truth)).sum()
        first_correct = ((predictions_1 == ground_truth) & 
                        (predictions_2 != ground_truth)).sum()
        second_correct = ((predictions_1 != ground_truth) & 
                         (predictions_2 == ground_truth)).sum()
        both_wrong = ((predictions_1 != ground_truth) & 
                     (predictions_2 != ground_truth)).sum()

        # McNemar test
        if first_correct + second_correct > 0:
            chi2 = ((first_correct - second_correct) ** 2) / (
                first_correct + second_correct
            )
            p_value = stats.chi2.sf(chi2, 1)
        else:
            chi2 = 0
            p_value = 1.0

        return {
            "chi2_statistic": chi2,
            "p_value": p_value,
            "significant": p_value < 0.05,
        }
