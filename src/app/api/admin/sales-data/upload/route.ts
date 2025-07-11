import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';
import Papa from 'papaparse';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== Role.ADMIN) {
    return NextResponse.json({ message: '権限がありません' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ message: 'ファイルがありません。' }, { status: 400 });
    }

    const fileText = await file.text();

    return new Promise<NextResponse>((resolve, reject) => {
      Papa.parse(fileText, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const dataToCreate = results.data
              .map((row: any) => {
                const date = new Date(row.date);
                const amount = parseInt(row.amount, 10);

                if (isNaN(date.getTime()) || !row.timeSlot || isNaN(amount)) {
                  console.warn('Skipping invalid row:', row);
                  return null;
                }

                return {
                  date,
                  timeSlot: row.timeSlot.trim(),
                  amount,
                };
              })
              .filter(Boolean); // remove nulls

            if (dataToCreate.length === 0) {
              return resolve(NextResponse.json({ message: '有効なデータ行がありませんでした。' }, { status: 400 }));
            }
            
            const createResult = await prisma.salesData.createMany({
              data: dataToCreate as any[], // Casting to any to avoid type issue with filter(Boolean)
            });

            resolve(NextResponse.json({
              message: 'アップロード成功',
              count: createResult.count,
            }));
          } catch (dbError) {
            console.error('Database error during CSV import:', dbError);
            reject(NextResponse.json({ message: 'データベース登録中にエラーが発生しました。' }, { status: 500 }));
          }
        },
        error: (error: Error) => {
          console.error('CSV parsing error:', error.message);
          reject(NextResponse.json({ message: `CSVの解析に失敗しました: ${error.message}` }, { status: 400 }));
        },
      });
    });

  } catch (error) {
    console.error('File upload processing error:', error);
    return NextResponse.json({ message: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
} 