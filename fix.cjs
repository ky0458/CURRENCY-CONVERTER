const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');
code = code.replace(
`                         </div>
                      </>
                 )}
            </div>
            
          </div>`, 
`                         </div>
                      </>
                 )}
                 </>
                 )}
            </div>
            
          </div>`
);
fs.writeFileSync('App.tsx', code);
