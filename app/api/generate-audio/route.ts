import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import gTTS from 'gtts';

interface Scene {
  imagePrompt: string;
  contentText: string;
}

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  resource_type: string;
  format: string;
  version: number;
  type: string;
  created_at: string;
  bytes: number;
  url: string;
}

export async function POST(request: Request) {
  try {
    console.log('Starting audio generation process...');
    
    const { scenes, voice } = await request.json() as { scenes: Scene[], voice: string };
    console.log('Received scenes:', scenes.length, 'Voice:', voice);

    const combinedText = scenes.map(scene => scene.contentText).join('\n\n');
    console.log('Combined text length:', combinedText.length);

    if (combinedText.length === 0) {
      throw new Error('No text provided for audio generation');
    }

    console.log('Initializing gTTS...');
    const gtts = new gTTS(combinedText, 'en');

    console.log('Creating audio stream...');
    const audioStream = gtts.stream();
    const chunks: Buffer[] = [];

    // Convert stream to buffer using native Node.js streams
    await new Promise<void>((resolve, reject) => {
      audioStream.on('data', (chunk: Buffer) => {
        console.log('Received chunk of size:', chunk.length);
        chunks.push(chunk);
      });
      
      audioStream.on('end', () => {
        console.log('Stream ended successfully');
        resolve();
      });
      
      audioStream.on('error', (error: Error) => {
        console.error('Stream error:', error);
        reject(error);
      });
    });

    const audioBuffer = Buffer.concat(chunks);
    console.log('Final buffer size:', audioBuffer.length);

    const fileName = `audio_${Date.now()}.mp3`;
    console.log('Uploading to Cloudinary:', fileName);

    const uploadResult = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'auto',
          folder: 'reelsstack',
          public_id: fileName.replace('.mp3', ''),
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload successful');
            resolve(result as CloudinaryUploadResult);
          }
        }
      );

      // Set timeout for upload
      const uploadTimeout = setTimeout(() => {
        reject(new Error('Upload timed out after 30 seconds'));
      }, 30000);

      uploadStream.on('error', (error) => {
        clearTimeout(uploadTimeout);
        console.error('Upload stream error:', error);
        reject(error);
      });

      uploadStream.on('finish', () => {
        clearTimeout(uploadTimeout);
      });

      uploadStream.end(audioBuffer);
    });

    console.log('Process completed successfully');
    return NextResponse.json({
      success: true,
      message: 'Audio file generated and uploaded successfully',
      audioUrl: uploadResult.secure_url
    });

  } catch (error) {
    console.error('Error in audio generation process:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
