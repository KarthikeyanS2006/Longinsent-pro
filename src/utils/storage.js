import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const DOWNLOAD_DIR = FileSystem.documentDirectory + 'LonginsentPro/';
const DOWNLOAD_INDEX = 'downloaded_exams';

export async function ensureDownloadDir() {
  const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
  }
}

export async function downloadExam(examId, examMetadata) {
  try {
    await ensureDownloadDir();
    
    // Fetch FULL exam data with questions from database
    const { data: fullExamData, error } = await supabase
      .from('exam_archive')
      .select('*')
      .eq('id', examId)
      .single();
    
    if (error || !fullExamData) {
      console.error('Error fetching exam data:', error);
      return { success: false, error: 'Failed to fetch exam data' };
    }
    
    const filePath = `${DOWNLOAD_DIR}exam_${examId}.json`;
    const jsonContent = JSON.stringify(fullExamData, null, 2);
    
    await FileSystem.writeAsStringAsync(filePath, jsonContent);
    
    await addToDownloadIndex(examId, {
      examId,
      examName: fullExamData.exam_name,
      year: fullExamData.exam_year,
      downloadedAt: new Date().toISOString(),
      filePath,
    });
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Download error:', error);
    return { success: false, error: error.message };
  }
}

export async function getExamFromStorage(examId) {
  try {
    const filePath = `${DOWNLOAD_DIR}exam_${examId}.json`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (!fileInfo.exists) {
      return { success: false, error: 'Exam not found in storage' };
    }
    
    const content = await FileSystem.readAsStringAsync(filePath);
    const examData = JSON.parse(content);
    
    return { success: true, data: examData };
  } catch (error) {
    console.error('Read error:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteExamFromStorage(examId) {
  try {
    const filePath = `${DOWNLOAD_DIR}exam_${examId}.json`;
    await FileSystem.deleteAsync(filePath, { idempotent: true });
    await removeFromDownloadIndex(examId);
    
    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: error.message };
  }
}

export async function getDownloadIndex() {
  try {
    const index = await AsyncStorage.getItem(DOWNLOAD_INDEX);
    return index ? JSON.parse(index) : [];
  } catch (error) {
    console.error('Index read error:', error);
    return [];
  }
}

export async function addToDownloadIndex(examId, metadata) {
  try {
    const index = await getDownloadIndex();
    const existing = index.find(item => item.examId === examId);
    
    if (!existing) {
      index.push(metadata);
      await AsyncStorage.setItem(DOWNLOAD_INDEX, JSON.stringify(index));
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function removeFromDownloadIndex(examId) {
  try {
    const index = await getDownloadIndex();
    const filtered = index.filter(item => item.examId !== examId);
    await AsyncStorage.setItem(DOWNLOAD_INDEX, JSON.stringify(filtered));
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function isExamDownloaded(examId) {
  const index = await getDownloadIndex();
  return index.some(item => item.examId === examId);
}

export async function getStorageInfo() {
  try {
    await ensureDownloadDir();
    const files = await FileSystem.readDirectoryAsync(DOWNLOAD_DIR);
    let totalSize = 0;
    
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR + file);
      if (info.exists && info.size) {
        totalSize += info.size;
      }
    }
    
    const index = await getDownloadIndex();
    
    return {
      fileCount: files.length,
      totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      exams: index,
    };
  } catch (error) {
    return {
      fileCount: 0,
      totalSize: 0,
      totalSizeMB: '0.00',
      exams: [],
    };
  }
}

export async function clearAllDownloads() {
  try {
    await FileSystem.deleteAsync(DOWNLOAD_DIR, { idempotent: true });
    await AsyncStorage.removeItem(DOWNLOAD_INDEX);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
