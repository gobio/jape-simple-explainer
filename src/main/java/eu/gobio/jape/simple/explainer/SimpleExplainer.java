package eu.gobio.jape.simple.explainer;

import eu.gobio.jape.ExplainerActivator;
import io.undertow.Undertow;
import io.undertow.server.HttpHandler;
import io.undertow.server.HttpServerExchange;
import io.undertow.server.RoutingHandler;
import io.undertow.server.handlers.resource.ClassPathResourceManager;
import io.undertow.server.handlers.resource.ResourceHandler;
import io.undertow.server.handlers.resource.ResourceManager;
import io.undertow.util.Headers;
import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.core.LoggerContext;
import org.apache.logging.log4j.core.config.Configuration;
import org.apache.logging.log4j.status.StatusLogger;

import javax.json.bind.Jsonb;
import javax.json.bind.JsonbBuilder;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.Comparator;
import java.util.List;

public class SimpleExplainer implements ExplainerActivator {

    private Collector collector;
    private Jsonb jsonb;

    @Override
    public void activate() {
        jsonb = JsonbBuilder.create();
        installLogFilter();
        startServer();
        System.out.println("Server started...");
    }

    private void installLogFilter() {
        collector = new Collector();
        StatusLogger.getLogger().setLevel(Level.OFF);

        LoggerContext context = (LoggerContext) LogManager.getContext(false);
        Configuration config = context.getConfiguration();

        config.addFilter(collector);
    }

    private void startServer() {
        ResourceManager resourceManager = new ClassPathResourceManager(this.getClass().getClassLoader(), "web");
        ResourceHandler resourceHandler = new ResourceHandler(resourceManager);

        HttpHandler handler = new RoutingHandler()
                .get("/traces", this::traces)
                .get("/traces/{id}", this::traceById)
                .get("/traces/{id}/stages", this::traceStagesById)
                .get("/dump/{dir}", this::dump)
                .get("/*", resourceHandler);


        Undertow server = Undertow.builder().addHttpListener(5005, "localhost", handler).build();
        server.start();
    }

    private void dump(HttpServerExchange exchange) throws IOException {
        Path dumpDir = dumpDir(exchange);

        Files.write(dumpDir.resolve("index.html"), jsonb.toJson(traces()).getBytes());

        traces().forEach(trace -> {
            try {
                Path traceDir = dumpDir.resolve(trace.getId());
                Files.createDirectories(traceDir);
                Files.write(traceDir.resolve("index.html"), jsonb.toJson(trace).getBytes());
                Files.write(traceDir.resolve("stages"),jsonb.toJson(trace.getStages()).getBytes());
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
        exchange.getResponseSender().send("Dumped!");
    }

    private List<Trace> traces() {
        List<Trace> traces = collector.getTraces();
        traces.sort(Comparator.comparing(Trace::getStart).reversed());
        return traces;
    }

    private Path dumpDir(HttpServerExchange exchange) throws IOException {
        String dirName = exchange.getQueryParameters().get("dir").pop();
        Path dumpDir = Paths.get(dirName);
        if (Files.exists(dumpDir)) {
            Files.walkFileTree(dumpDir, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs)
                        throws IOException
                {
                    Files.delete(file);
                    return FileVisitResult.CONTINUE;
                }
                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException e)
                        throws IOException
                {
                    if (e == null) {
                        Files.delete(dir);
                        return FileVisitResult.CONTINUE;
                    } else {
                        // directory iteration failed
                        throw e;
                    }
                }
            });
        }
        return Files.createDirectory(dumpDir);
    }

    private void traceById(HttpServerExchange exchange) {
        setResponseType(exchange);
        exchange.getResponseSender()
                .send(jsonb.toJson(getRequestedTrace(exchange)));
    }

    private void setResponseType(HttpServerExchange exchange) {
        exchange.getResponseHeaders()
                .put(Headers.CONTENT_TYPE, "application/json");
    }

    private Trace getRequestedTrace(HttpServerExchange exchange) {
        return collector.getTraceById(exchange
                .getQueryParameters()
                .get("id")
                .pop());
    }

    private void traceStagesById(HttpServerExchange exchange) {
        setResponseType(exchange);
        Trace trace = getRequestedTrace(exchange);

        exchange.getResponseSender().send(jsonb.toJson(trace.getStages()));
    }

    private void traces(HttpServerExchange exchange) {
        setResponseType(exchange);
        exchange.getResponseSender().send(jsonb.toJson(traces()));
    }
}
