import { useState, useEffect, useCallback } from 'react';
import { BetaWeeklyReport } from '../types';
import { storage } from '../utils/storage';
import { getWeekKey } from '../constants/beta';

export function useBetaReports() {
  const [reports, setReports] = useState<BetaWeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    const init = async () => {
      await storage.getBetaReportsAsync();
      setReports(storage.getBetaReports());
      setLoading(false);
      unsub = storage.subscribeBetaReports((next) => setReports(next));
    };
    init();
    return () => { unsub?.(); };
  }, []);

  const saveReport = useCallback(async (report: BetaWeeklyReport) => {
    await storage.saveBetaReport(report);
  }, []);

  const getReportForBranchAndWeek = useCallback((branchName: string, weekKey: string): BetaWeeklyReport | undefined => {
    return reports.find(r => r.branchName === branchName && r.weekKey === weekKey);
  }, [reports]);

  const getReportsByWeek = useCallback((weekKey: string): BetaWeeklyReport[] => {
    return reports.filter(r => r.weekKey === weekKey);
  }, [reports]);

  return {
    reports,
    loading,
    saveReport,
    getReportForBranchAndWeek,
    getReportsByWeek,
    currentWeekKey: getWeekKey(new Date()),
  };
}
