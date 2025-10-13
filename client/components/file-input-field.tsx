import { Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "./ui/input";

export default function FileInputField({
    label,
    id,
    value,
    onChange,
    helperText,
    uploadProgress,
}: {
    label: string;
    id: string;
    value: File | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    helperText?: string;
    uploadProgress: Record<string, number>;
}) {
    const progressKey = id;
    const progress = uploadProgress[progressKey];

    return (
        <div className="space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <Input
                    id={id}
                    type="file"
                    accept="image/*"
                    onChange={onChange}
                    className="cursor-pointer file:mr-4 file:px-2 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {value && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4 text-primary" />
                        <span className="truncate">{value.name}</span>
                        {progress !== undefined && progress < 100 && (
                            <span className="ml-auto text-xs">
                                ({progress}%)
                            </span>
                        )}
                    </div>
                )}
            </div>
            {helperText && (
                <p className="text-xs text-muted-foreground">{helperText}</p>
            )}
            {progress !== undefined && progress < 100 && (
                <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}
