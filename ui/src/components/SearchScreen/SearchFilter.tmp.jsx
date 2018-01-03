{activeFilterTags.length > 0 &&
            <div className="search-query__filters">
              Filtering for
              {activeFilterTags.map((tag, i) => (
                <span key={tag.id}>
                  {i > 0 ? (i < activeFilterTags.length - 1 ? ', ' : ' or ') : ' '}
                  <span className="pt-tag pt-tag-removable" data-filter={tag.filter}>
                    {tag.label}
                    <button className="pt-tag-remove"
                      onClick={this.onMultiFilterChange.bind(null, tag.filter, tag.id)} />
                  </span>
                </span>
              ))}
          </div>}