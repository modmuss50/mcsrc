import { BehaviorSubject } from "rxjs";

export type JavadocString = string;

export interface JavadocData {
    classes: Record<string, {
        javadoc: JavadocString | null;
        methods: Record<string, JavadocString>;
        fields: Record<string, JavadocString>;
    }>;
}

export const javadocData = new BehaviorSubject<JavadocData>({
    classes: {}
});