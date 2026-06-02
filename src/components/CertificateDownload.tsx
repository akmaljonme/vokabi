import { Download } from 'lucide-react';
import { TestResult } from '@/types/cefr';
import { useAuth } from '@/contexts/AuthContext';
import { supabase as _sbClient } from '@/integrations/supabase/client';
const supabase: any = _sbClient;
import { useEffect, useState } from 'react';

interface CertificateDownloadProps {
  result: TestResult;
}

export const CertificateDownload = ({ result }: CertificateDownloadProps) => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState<string>('');

  useEffect(() => {
    const fetchName = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();
      setFullName(data?.full_name || user.email?.split('@')[0] || 'Student');
    };
    fetchName();
  }, [user]);

  const downloadCertificate = () => {
    const canvas = document.createElement('canvas');
    const w = 1200;
    const h = 850;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#FFFEF7';
    ctx.fillRect(0, 0, w, h);

    // Border
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 6;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    // Inner border
    ctx.strokeStyle = '#E8D48B';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, w - 90, h - 90);

    // Decorative corners
    const cornerSize = 40;
    const corners = [
      [50, 50], [w - 50, 50], [50, h - 50], [w - 50, h - 50]
    ];
    ctx.fillStyle = '#C9A84C';
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // Header accent line
    ctx.fillStyle = '#C9A84C';
    ctx.fillRect(w / 2 - 100, 90, 200, 3);

    // Title
    ctx.fillStyle = '#1a1a2e';
    ctx.font = 'bold 18px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('VOKABI', w / 2, 130);

    ctx.font = 'bold 42px Georgia, serif';
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText('CERTIFICATE', w / 2, 190);

    ctx.font = '20px Georgia, serif';
    ctx.fillStyle = '#666';
    ctx.fillText('OF ACHIEVEMENT', w / 2, 225);

    // Accent line
    ctx.fillStyle = '#C9A84C';
    ctx.fillRect(w / 2 - 80, 245, 160, 2);

    // "This is to certify that"
    ctx.font = 'italic 18px Georgia, serif';
    ctx.fillStyle = '#555';
    ctx.fillText('This is to certify that', w / 2, 295);

    // Name
    ctx.font = 'bold 38px Georgia, serif';
    ctx.fillStyle = '#1a1a2e';
    ctx.fillText(fullName.toUpperCase(), w / 2, 350);

    // Underline for name
    const nameWidth = ctx.measureText(fullName.toUpperCase()).width;
    ctx.strokeStyle = '#C9A84C';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(w / 2 - nameWidth / 2 - 20, 360);
    ctx.lineTo(w / 2 + nameWidth / 2 + 20, 360);
    ctx.stroke();

    // Description
    ctx.font = '18px Georgia, serif';
    ctx.fillStyle = '#555';
    ctx.fillText('has successfully completed the', w / 2, 410);

    // Test details
    ctx.font = 'bold 28px Georgia, serif';
    ctx.fillStyle = '#e31e24';
    ctx.fillText(`${result.level} ${result.skill.charAt(0).toUpperCase() + result.skill.slice(1)} Test`, w / 2, 455);

    // Score info
    ctx.font = '18px Georgia, serif';
    ctx.fillStyle = '#555';
    ctx.fillText(`with a score of ${result.percentage}% (${result.correctAnswers}/${result.totalQuestions} correct)`, w / 2, 500);

    // Pass/Fail badge
    if (result.passed) {
      ctx.font = 'bold 16px Georgia, serif';
      ctx.fillStyle = '#15803d';
      ctx.fillText('✓ PASSED', w / 2, 540);
    }

    // Date
    const date = new Date().toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    ctx.font = '16px Georgia, serif';
    ctx.fillStyle = '#777';
    ctx.fillText(`Date: ${date}`, w / 2, 590);

    // Bottom accent line
    ctx.fillStyle = '#C9A84C';
    ctx.fillRect(w / 2 - 100, 630, 200, 2);

    // Signatures area
    ctx.font = '14px Georgia, serif';
    ctx.fillStyle = '#999';

    // Left signature
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 720);
    ctx.lineTo(400, 720);
    ctx.stroke();
    ctx.fillText('Vokabi', 300, 745);

    // Right signature
    ctx.beginPath();
    ctx.moveTo(800, 720);
    ctx.lineTo(1000, 720);
    ctx.stroke();
    ctx.fillText('Examination Board', 900, 745);

    // Footer
    ctx.font = '12px Georgia, serif';
    ctx.fillStyle = '#bbb';
    ctx.fillText('This certificate is issued by Vokabi', w / 2, 795);

    // Download
    const link = document.createElement('a');
    link.download = `CEFR_Certificate_${result.level}_${result.skill}_${fullName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!user) return null;

  return (
    <button
      onClick={downloadCertificate}
      className="btn-outline flex items-center gap-2"
    >
      <Download className="w-5 h-5" />
      Sertifikat yuklab olish
    </button>
  );
};
