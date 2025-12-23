package mcsrc.test;

import mcsrc.ClassIndexVisitor;
import mcsrc.Context;
import org.objectweb.asm.ClassReader;
import org.objectweb.asm.Opcodes;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.stream.Stream;

public class ClassIndexVisitorTest {
    static class TestContext implements Context {
        @Override
        public void addClassUsage(String clazz, String usage) {
            System.out.println("Class usage: " + clazz + " -> " + usage);
        }

        @Override
        public void addMethodUsage(String method, String usage) {
            System.out.println("Method usage: " + method + " -> " + usage);
        }

        @Override
        public void addFieldUsage(String field, String usage) {
            System.out.println("Field usage: " + field + " -> " + usage);
        }
    }

    static void main(String[] args) throws IOException {
        if (args.length < 1) {
            System.err.println("Usage: ClassIndexVisitorTest <path-to-jar>");
            System.exit(1);
        }

        String jarPath = args[0];
        processJarFile(jarPath);
    }

    public static void processJarFile(String jarPath) throws IOException {
        Path jarFilePath = Paths.get(jarPath);

        if (!Files.exists(jarFilePath)) {
            throw new IOException("Jar file not found: " + jarPath);
        }

        Context context = new TestContext();

        try (FileSystem jarFs = FileSystems.newFileSystem(jarFilePath, (ClassLoader) null)) {
            Path root = jarFs.getPath("/");

            try (Stream<Path> walk = Files.walk(root)) {
                walk.filter(path -> path.toString().endsWith(".class"))
                    .forEach(classPath -> {
                        try {
                            processClassFile(classPath, context);
                        } catch (IOException e) {
                            System.err.println("Error processing " + classPath + ": " + e.getMessage());
                        }
                    });
            }
        }

        System.out.println("Finished processing jar file: " + jarPath);
    }

    private static void processClassFile(Path classPath, Context context) throws IOException {
        try (InputStream is = Files.newInputStream(classPath)) {
            byte[] classBytes = is.readAllBytes();

            ClassReader classReader = new ClassReader(classBytes);
            ClassIndexVisitor visitor = new ClassIndexVisitor(Opcodes.ASM9, context);
            classReader.accept(visitor, 0);

            System.out.println("Processed: " + classPath);
        }
    }
}
