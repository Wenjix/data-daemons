import axios from 'axios'
import type { AnalyzeRequest, AnalyzeResponse } from './types'
import { useSettingsStore } from '../stores/settingsStore'

export async function postAnalyze(req: AnalyzeRequest): Promise<AnalyzeResponse> {
  const base = useSettingsStore.getState().apiBaseUrl
  const url = `${base}/analyze`
  const { data } = await axios.post(url, req)
  return data
}