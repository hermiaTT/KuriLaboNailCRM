import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

export async function saveImageToLibrary(url: string) {
  const permission = await MediaLibrary.requestPermissionsAsync(false, ['photo']);
  if (!permission.granted) throw new Error('Photo library permission is required.');
  const extension = url.toLowerCase().includes('.png') ? 'png' : 'jpg';
  const target = `${FileSystem.cacheDirectory}kuri-${Date.now()}.${extension}`;
  const downloaded = await FileSystem.downloadAsync(url, target);
  await MediaLibrary.createAssetAsync(downloaded.uri);
}
