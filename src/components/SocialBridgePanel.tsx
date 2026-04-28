type SocialBridgePanelProps = {
  isSignedIn: boolean;
  isWalkerBucksBridgeConfigured: boolean;
};

export const SocialBridgePanel = ({ isSignedIn, isWalkerBucksBridgeConfigured }: SocialBridgePanelProps) => (
  <section className="collection-panel" aria-label="Social bridge">
    <div className="section-head">
      <h4>Social Bridge</h4>
      <span>{isSignedIn && isWalkerBucksBridgeConfigured ? 'Contract ready' : 'Gated'}</span>
    </div>

    <article className="panel shop-card">
      <div className="card-row">
        <h4>Discord</h4>
        <span className="pill">First target</span>
      </div>
      <p className="muted">
        Identity linking is documented before cross-platform rewards. Discord secrets stay server-side.
      </p>
    </article>

    <article className="panel shop-card">
      <div className="card-row">
        <h4>Telegram</h4>
        <span className="pill">Future</span>
      </div>
      <p className="muted">Deferred until Discord linking and shared WalkerBucks flows are stable.</p>
    </article>
  </section>
);
