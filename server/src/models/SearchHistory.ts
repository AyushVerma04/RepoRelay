import mongoose, { Document, Schema } from 'mongoose';

export interface ISearchHistory extends Document {
  userId: string;
  repoUrl: string;
  repoName: string;
  searchedAt: Date;
}

const SearchHistorySchema: Schema = new Schema({
  userId: { type: String, required: true },
  repoUrl: { type: String, required: true },
  repoName: { type: String, required: true },
  searchedAt: { type: Date, default: Date.now }
});

export default mongoose.model<ISearchHistory>('SearchHistory', SearchHistorySchema);
