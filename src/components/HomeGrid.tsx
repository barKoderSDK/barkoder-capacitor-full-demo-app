import type { HomeSection } from '../types/types';

interface HomeGridProps {
  sections: HomeSection[];
  onItemPress: (item: HomeSection['data'][number]) => void;
}

export default function HomeGrid({ sections, onItemPress }: HomeGridProps) {
  return (
    <div className="home-grid-scroll">
      <div className="home-grid-content">
        {sections.map((section) => (
          <section key={section.title} className="home-section">
            <h3 className="home-section-title">{section.title}</h3>
            <div className="home-grid">
              {section.data.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="home-grid-item"
                  onClick={() => onItemPress(item)}
                >
                  <img src={item.icon} alt={item.label} className="home-grid-icon" />
                  <span className="home-grid-label">{item.label}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}