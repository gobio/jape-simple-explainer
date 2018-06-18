package eu.gobio.jape.simple.explainer;

public class Flow {
    Integer from;
    String value;

    public Flow(Integer from, String value) {
        this.from = from;
        this.value = value;
    }

    public Integer getFrom() {
        return from;
    }

    public void setFrom(Integer from) {
        this.from = from;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
