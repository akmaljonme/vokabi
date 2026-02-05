 import { useState, useEffect } from 'react';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import { Loader2, Plus, Trash2 } from 'lucide-react';
 
 interface Paragraph {
   label: string;
   text: string;
 }
 
 interface ReadingPassage {
   id?: string;
   test_id: string;
   title: string;
   content: string;
   paragraphs: Paragraph[] | null;
   order_index: number;
 }
 
 interface ReadingPassageDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   passage: ReadingPassage | null;
   testId: string;
   onSave: (data: ReadingPassage) => Promise<void>;
   loading: boolean;
   passageCount: number;
 }
 
 export const ReadingPassageDialog = ({
   open,
   onOpenChange,
   passage,
   testId,
   onSave,
   loading,
   passageCount,
 }: ReadingPassageDialogProps) => {
   const [formData, setFormData] = useState<ReadingPassage>({
     test_id: testId,
     title: '',
     content: '',
     paragraphs: null,
     order_index: 0,
   });
   const [useParagraphs, setUseParagraphs] = useState(false);
   const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
 
   useEffect(() => {
     if (passage) {
       setFormData({
         id: passage.id,
         test_id: testId,
         title: passage.title,
         content: passage.content,
         paragraphs: passage.paragraphs,
         order_index: passage.order_index,
       });
       if (passage.paragraphs && passage.paragraphs.length > 0) {
         setUseParagraphs(true);
         setParagraphs(passage.paragraphs);
       } else {
         setUseParagraphs(false);
         setParagraphs([]);
       }
     } else {
       setFormData({
         test_id: testId,
         title: '',
         content: '',
         paragraphs: null,
         order_index: passageCount,
       });
       setUseParagraphs(false);
       setParagraphs([]);
     }
   }, [passage, testId, passageCount, open]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     // Build content from paragraphs if using them
     let content = formData.content;
     let finalParagraphs: Paragraph[] | null = null;
     
     if (useParagraphs && paragraphs.length > 0) {
       finalParagraphs = paragraphs.filter(p => p.text.trim());
       content = finalParagraphs.map(p => `${p.label}: ${p.text}`).join('\n\n');
     }
 
     await onSave({
       ...formData,
       content,
       paragraphs: finalParagraphs,
     });
   };
 
   const addParagraph = () => {
     const nextLabel = String.fromCharCode(65 + paragraphs.length); // A, B, C...
     setParagraphs([...paragraphs, { label: nextLabel, text: '' }]);
   };
 
   const updateParagraph = (index: number, field: keyof Paragraph, value: string) => {
     const updated = [...paragraphs];
     updated[index] = { ...updated[index], [field]: value };
     setParagraphs(updated);
   };
 
   const removeParagraph = (index: number) => {
     setParagraphs(paragraphs.filter((_, i) => i !== index));
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>{passage ? 'Matnni tahrirlash' : 'Yangi matn qo\'shish'}</DialogTitle>
         </DialogHeader>
         <form onSubmit={handleSubmit} className="space-y-4">
           <div className="space-y-2">
             <Label htmlFor="title">Sarlavha *</Label>
             <Input
               id="title"
               value={formData.title}
               onChange={(e) => setFormData({ ...formData, title: e.target.value })}
               placeholder="The Future of Renewable Energy"
               required
             />
           </div>
 
           <div className="flex items-center gap-4">
             <Button
               type="button"
               variant={useParagraphs ? 'outline' : 'default'}
               size="sm"
               onClick={() => setUseParagraphs(false)}
             >
               Oddiy matn
             </Button>
             <Button
               type="button"
               variant={useParagraphs ? 'default' : 'outline'}
               size="sm"
               onClick={() => {
                 setUseParagraphs(true);
                 if (paragraphs.length === 0) {
                   setParagraphs([{ label: 'A', text: '' }]);
                 }
               }}
             >
               Paragraflar bilan
             </Button>
           </div>
 
           {!useParagraphs ? (
             <div className="space-y-2">
               <Label htmlFor="content">Matn *</Label>
               <Textarea
                 id="content"
                 value={formData.content}
                 onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                 placeholder="Reading passage matni..."
                 rows={12}
                 required
               />
               <p className="text-xs text-muted-foreground">
                 Matnni to'liq kiriting. Paragraflarni bo'sh qator bilan ajrating.
               </p>
             </div>
           ) : (
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <Label>Paragraflar</Label>
                 <Button type="button" variant="outline" size="sm" onClick={addParagraph}>
                   <Plus className="w-4 h-4 mr-1" />
                   Paragraf qo'shish
                 </Button>
               </div>
               
               <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                 {paragraphs.map((para, index) => (
                   <div key={index} className="flex gap-2 items-start">
                     <Input
                       value={para.label}
                       onChange={(e) => updateParagraph(index, 'label', e.target.value)}
                       placeholder="A"
                       className="w-16 shrink-0"
                     />
                     <Textarea
                       value={para.text}
                       onChange={(e) => updateParagraph(index, 'text', e.target.value)}
                       placeholder={`${para.label} paragraf matni...`}
                       rows={3}
                       className="flex-1"
                     />
                     <Button
                       type="button"
                       variant="ghost"
                       size="icon"
                       onClick={() => removeParagraph(index)}
                       className="shrink-0 text-destructive hover:text-destructive"
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                   </div>
                 ))}
               </div>
               
               {paragraphs.length === 0 && (
                 <p className="text-sm text-muted-foreground text-center py-4">
                   Paragraf qo'shish uchun yuqoridagi tugmani bosing
                 </p>
               )}
             </div>
           )}
 
           <div className="space-y-2">
             <Label htmlFor="order">Tartib raqami</Label>
             <Input
               id="order"
               type="number"
               min={0}
               value={formData.order_index}
               onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
             />
           </div>
 
           <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               Bekor qilish
             </Button>
             <Button 
               type="submit" 
               disabled={loading || !formData.title || (!useParagraphs && !formData.content) || (useParagraphs && paragraphs.filter(p => p.text.trim()).length === 0)}
             >
               {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
               {passage ? 'Saqlash' : 'Qo\'shish'}
             </Button>
           </DialogFooter>
         </form>
       </DialogContent>
     </Dialog>
   );
 };